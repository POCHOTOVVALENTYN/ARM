with open("src/components/tabs/NetworkSettingsTab.tsx", "r") as f:
    text = f.read()

text = text.replace("logicalRoutes.filter", "routes.filter")
text = text.replace("{route.short_name}", "{route.number}")
text = text.replace("{route.long_name}", "{route.name}")

with open("src/components/tabs/NetworkSettingsTab.tsx", "w") as f:
    f.write(text)
