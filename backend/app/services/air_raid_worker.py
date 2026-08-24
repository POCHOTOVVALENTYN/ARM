import asyncio
import re
import json
import time
from datetime import datetime, timezone
import httpx
from app.core.redis import get_redis
from app.core.logging_config import get_logger
from app.api.websocket import ws_manager

logger = get_logger("air_raid_worker")

async def check_ubilling_alert_api(client: httpx.AsyncClient) -> dict | None:
    """Опитує структурований JSON API системи сповіщення тривог в Україні."""
    try:
        res = await client.get("https://ubilling.net.ua/aerialalerts/", timeout=5.0)
        if res.status_code == 200:
            data = res.json()
            states = data.get("states", {})
            odesa_data = states.get("Одеська область") or states.get("Одеса") or states.get("м. Одеса")
            if odesa_data:
                is_active = bool(odesa_data.get("alertnow"))
                changed_at = odesa_data.get("changed")
                return {
                    "active": is_active,
                    "time": changed_at,
                    "text": f"{'🚨 ОГОЛОШЕНО' if is_active else '🟢 ВІДБІЙ'} повітряної тривоги (Одеська область)",
                    "source": "UBilling Aerial Alerts API"
                }
    except Exception as e:
        logger.debug(f"Ubilling alerts API error: {e}")
    return None

async def parse_telegram_feed(client: httpx.AsyncClient, url: str) -> dict | None:
    """Парсить публічну web-стрічку Telegram для отримання останнього статусу тривоги в Одесі та районі."""
    try:
        res = await client.get(url, timeout=6.0)
        if res.status_code != 200:
            return None
        
        html = res.text
        blocks = re.findall(r'<div class="tgme_widget_message_wrap[^"]*"[^>]*>(.*?)</div>\s*</div>\s*</div>', html, re.DOTALL)
        if not blocks:
            blocks = re.findall(r'<div class="tgme_widget_message_text[^"]*"[^>]*>(.*?)</div>', html, re.DOTALL)

        for b in reversed(blocks):
            text_match = re.search(r'<div class="tgme_widget_message_text[^"]*"[^>]*>(.*?)</div>', b, re.DOTALL)
            raw_text = text_match.group(1) if text_match else b
            time_match = re.search(r'<time datetime="([^"]+)"', b)
            
            clean_text = re.sub(r'<[^>]+>', ' ', raw_text).replace('&#33;', '!').strip()
            msg_time = time_match.group(1) if time_match else None
            lower = clean_text.lower()

            # Перевіряємо сувору прив'язку до Одеси / Одеського району
            if 'одес' in lower and ('повітряна тривога' in lower or 'відбій' in lower or 'тривог' in lower):
                is_alarm = '🔴' in clean_text or ('повітряна тривога' in lower and 'відбій' not in lower)
                is_clear = '🟢' in clean_text or 'відбій' in lower
                
                if is_alarm or is_clear:
                    return {
                        "active": bool(is_alarm and not is_clear),
                        "text": clean_text,
                        "time": msg_time,
                        "source": url
                    }
    except Exception as e:
        logger.debug(f"Telegram feed {url} error: {e}")
    return None

async def fetch_current_air_raid_status(client: httpx.AsyncClient) -> dict:
    """
    Отримує поточний статус повітряної тривоги в м. Одеса та Одеському районі
    шляхом опитування кількох незалежних каналів.
    """
    # 1. Офіційний структурований фід
    ub_data = await check_ubilling_alert_api(client)
    if ub_data:
        return ub_data

    # 2. Офіційний канал Одеської міської ради (м. Одеса)
    st = await parse_telegram_feed(client, "https://t.me/s/odesacityofficial")
    if st:
        return st
    
    # 3. Офіційний канал Одеської ОВА (м. Одеса та Одеський район)
    st = await parse_telegram_feed(client, "https://t.me/s/odesa_oda")
    if st:
        return st

    # 4. ДСНС України
    st = await parse_telegram_feed(client, "https://t.me/s/air_alert_ua")
    if st:
        return st

    return {"active": False, "text": "Ситуація спокійна", "time": None, "source": "ОМЕТ Моніторинг"}

async def run_air_raid_monitor():
    """
    Фоновий неперервний моніторинг повітряної тривоги в м. Одеса та Одеському районі.
    Опитує офіційні джерела кожні 10 секунд та автоматично розсилає оновлення.
    """
    logger.info("🚨 [AIR-RAID] Фоновий сервіс авто-моніторингу тривог Одеси та району запущено")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "uk,en;q=0.9"
    }

    last_active_state: bool | None = None

    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        while True:
            try:
                status_data = await fetch_current_air_raid_status(client)
                is_active = status_data["active"]
                msg_text = status_data.get("text", "")
                raw_time = status_data.get("time")

                started_at = raw_time if is_active and raw_time else (
                    datetime.now(timezone.utc).isoformat() if is_active else None
                )

                status_obj = {
                    "active": is_active,
                    "city": "м. Одеса та Одеський район",
                    "started_at": started_at,
                    "message": msg_text or ("Повітряна тривога в м. Одеса та Одеському районі" if is_active else "Відбій повітряної тривоги"),
                    "source": status_data.get("source", "Офіційні канали ОМР / ОВА / ДСНС"),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }

                # Зберігаємо в Redis
                try:
                    redis = await get_redis()
                    await redis.set("emergency:air_raid_status", json.dumps(status_obj))
                except Exception as re_err:
                    logger.debug(f"Redis write error in air_raid_worker: {re_err}")

                # Якщо стан змінився — миттєво сповіщаємо всіх через WebSocket
                if last_active_state is None or last_active_state != is_active:
                    if is_active:
                        logger.warning(f"🚨 [AIR-RAID-AUTO] ОГОЛОШЕНО ПОВІТРЯНУ ТРИВОГУ (м. Одеса та Одеський район)! ({msg_text})")
                    else:
                        logger.info(f"🟢 [AIR-RAID-AUTO] ВІДБІЙ ПОВІТРЯНОЇ ТРИВОГИ (м. Одеса та Одеський район). ({msg_text})")

                    await ws_manager.broadcast({
                        "type": "AIR_RAID_UPDATE",
                        "payload": status_obj
                    })
                    last_active_state = is_active

            except asyncio.CancelledError:
                logger.info("🛑 [AIR-RAID] Фоновий моніторинг тривог зупинено")
                break
            except Exception as e:
                logger.error(f"Помилка у циклі авто-моніторингу тривог: {e}")

            await asyncio.sleep(10)

