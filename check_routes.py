"""
Check if generate_key route exists
"""
import sys
sys.path.insert(0, 'backend')
from app import create_app

app = create_app()

print("=" * 70)
print("REGISTERED ROUTES:")
print("=" * 70)
for rule in app.url_map.iter_rules():
    methods = ','.join(sorted(rule.methods - {'HEAD', 'OPTIONS'}))
    print(f"{rule.rule:50s} [{methods}]")

print("\n" + "=" * 70)
print("CHECKING GENERATE_KEY ROUTE:")
print("=" * 70)
generate_key_routes = [r for r in app.url_map.iter_rules() if 'generate_key' in str(r)]
if generate_key_routes:
    for r in generate_key_routes:
        print(f"✅ Found: {r}")
else:
    print("❌ NOT FOUND! Route /api/aes/generate_key is missing!")
