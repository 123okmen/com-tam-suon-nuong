import os

b64 = open('logo_base64.txt').read().strip()
content = open('src/utils/print.ts', encoding='utf-8').read()

new_content = content.replace(
    '<div class="title">${BRAND_NAME}</div>',
    f'<img src="data:image/png;base64,{b64}" style="width: 250px; margin-bottom: 5px;" /><div class="title">${{BRAND_NAME}}</div>'
)

open('src/utils/print.ts', 'w', encoding='utf-8').write(new_content)
print("Updated print.ts")
