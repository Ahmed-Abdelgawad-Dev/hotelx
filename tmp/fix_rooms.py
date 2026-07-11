# Fix rooms.html - remove prices, update buttons
with open('hotelx/templates/pages/rooms.html', 'r') as f:
    content = f.read()

new_block = '''          <div class="divider my-2"></div>
          <div class="flex items-center justify-end">
            <a href="https://wa.me/201026290435"
               class="btn-ignite relative btn btn-primary btn-sm text-white rounded-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-xl transition-shadow duration-300">
              <span class="ignite-border">
                <span class="trace trace-top"></span>
                <span class="trace trace-right"></span>
                <span class="trace trace-bottom"></span>
                <span class="trace trace-left"></span>
              </span>
              <span class="relative z-10 flex items-center gap-1.5">
                Book Now
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </a>
          </div>'''

import re
# Find all price + btn blocks and replace them
pattern = r'<div class="divider my-2"></div>\s*<div class="flex items-center justify-between">\s*<div>\s*<span class="text-2xl font-bold text-primary">\$[0-9]+</span>\s*<span class="text-sm text-base-content/50">/ night</span>\s*</div>\s*<a href="#" class="btn-ignite relative btn btn-primary btn-sm text-white rounded-lg">\s*<span class="ignite-border">\s*<span class="trace trace-top"></span>\s*<span class="trace trace-right"></span>\s*<span class="trace trace-bottom"></span>\s*<span class="trace trace-left"></span>\s*</span>\s*<span class="relative z-10">Book Now</span>\s*</a>\s*</div>'

count = len(re.findall(pattern, content))
content = re.sub(pattern, new_block, content)
print(f"Replaced {count} price+button blocks")

with open('hotelx/templates/pages/rooms.html', 'w') as f:
    f.write(content)
print("Done")
