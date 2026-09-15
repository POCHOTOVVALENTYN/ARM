"""
End-to-end test for GTFS export and validation endpoints.
Uses ASGI Transport with FastAPI test client.
"""

import asyncio
import io
import zipfile
import httpx
from app.main import app

async def run_gtfs_tests():
    print("🚦 Running GTFS Open Data pipeline integration tests...")
    
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test validate-gtfs endpoint
        print("\n1. Testing GET /api/v1/schedules/validate-gtfs ...")
        resp = await client.get("/api/v1/schedules/validate-gtfs")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        validation = resp.json()
        print("Validation response:", validation)
        assert validation["status"] == "VALID"
        assert validation["agency_name"] == "КП «Одесміськелектротранс»"
        assert validation["counts"]["routes"] > 0
        assert validation["counts"]["stops"] > 0
        assert validation["counts"]["trips"] > 0
        print(f"✅ Validation OK: {validation['counts']['routes']} routes, {validation['counts']['stops']} stops, {validation['counts']['trips']} trips")

        # 2. Test export-gtfs.zip endpoint
        print("\n2. Testing GET /api/v1/schedules/export-gtfs.zip ...")
        resp_zip = await client.get("/api/v1/schedules/export-gtfs.zip")
        assert resp_zip.status_code == 200, f"Expected 200, got {resp_zip.status_code}"
        assert resp_zip.headers.get("content-type") == "application/zip"
        assert "attachment; filename=" in resp_zip.headers.get("content-disposition", "")
        
        zip_bytes = resp_zip.content
        assert len(zip_bytes) > 1000, f"Zip file suspiciously small: {len(zip_bytes)} bytes"
        
        # 3. Verify ZIP internal structure
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
            namelist = z.namelist()
            print("Files inside GTFS zip:", namelist)
            expected_files = ["agency.txt", "calendar.txt", "routes.txt", "stops.txt", "trips.txt", "stop_times.txt"]
            for ef in expected_files:
                assert ef in namelist, f"Missing required GTFS file: {ef}"
            
            # Verify agency contents
            agency_txt = z.read("agency.txt").decode("utf-8")
            assert "КП «Одесміськелектротранс»" in agency_txt
            assert "Europe/Kyiv" in agency_txt
            
            # Verify routes
            routes_txt = z.read("routes.txt").decode("utf-8")
            assert "route_id" in routes_txt
            assert "OMET" in routes_txt
            
            # Verify stops
            stops_txt = z.read("stops.txt").decode("utf-8")
            assert "stop_id" in stops_txt
            assert "stop_lat" in stops_txt
            
            print(f"✅ ZIP Archive structure verified: {len(namelist)} files, total size {len(zip_bytes):,} bytes")

    print("\n🎉 ALL GTFS INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run_gtfs_tests())
