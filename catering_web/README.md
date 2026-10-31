# Momo Fresh Catering Website

A simple static catering website for Indian and Nepali food orders. Customers can browse the menu, choose options such as size, variant, and style, add notes per item, and place the order via WhatsApp.

## Features

- Menu with categories and item cards
- Half-size and full-size catering options
- Variant and style selection
- Per-item notes in the cart
- Order summary
- WhatsApp order message generation
- Responsive layout
- Easy menu updates through a JSON file

## Project structure

- index.html — main page structure
- styles.css — design and responsiveness
- app.js — menu rendering, cart logic, and WhatsApp order flow
- data/menu.json — menu data and pricing

## How to edit the menu

Open data/menu.json and update the item details.

Example fields:

- name
- category
- description
- tags
- isActive
- variants
- styles
- sizes

For example, to add a new item, copy an existing object and update its values.

## Local preview

From the project folder, run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages deployment

1. Push this project to a GitHub repository.
2. Open the repository settings.
3. Go to Pages.
4. Select the main branch or root folder as the source.
5. Save and wait for the site to publish.

## WhatsApp number

The app currently uses the WhatsApp number in app.js:

```js
const whatsappNumber = '919876543210';
```

Update it to your own WhatsApp number before publishing.

## Notes

This project is intentionally static and easy to maintain. It works well for a small catering business and for free hosting on GitHub Pages.
