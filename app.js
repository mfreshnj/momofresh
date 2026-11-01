const menuGrid = document.getElementById('menuGrid');
const categoryFilters = document.getElementById('categoryFilters');
const cartCount = document.getElementById('cartCount');
const cartItemsEl = document.getElementById('cartItems');
const emptyCart = document.getElementById('emptyCart');
const subtotalValue = document.getElementById('subtotalValue');
const cartPanel = document.getElementById('cartPanel');
const customizerModal = document.getElementById('customizerModal');
const reviewModal = document.getElementById('reviewModal');
const customizerTitle = document.getElementById('customizerTitle');
const customizerDescription = document.getElementById('customizerDescription');
const reviewOrderSummary = document.getElementById('reviewOrderSummary');
const reviewSubtotal = document.getElementById('reviewSubtotal');
const modalStyle = document.getElementById('modalStyle');
const modalSize = document.getElementById('modalSize');
const modalQty = document.getElementById('modalQty');
const modalNote = document.getElementById('modalNote');
const modalNotePanel = document.getElementById('modalNotePanel');
const modalPrice = document.getElementById('modalPrice');

const cart = [];
const state = {
  activeCategory: 'All',
  menu: [],
  currentItem: null,
  currentCartIndex: null
};

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

function getDisplaySizeLabel(item) {
  const sizeText = item?.size || 'Standard';
  const pcsText = item?.pcs ? String(item.pcs).trim() : '';
  return pcsText ? `${sizeText} (${pcsText})` : sizeText;
}

function getDefaultVariant(item) {
  return item.variants && item.variants.length ? item.variants[0] : null;
}

function getDefaultSize(item) {
  return item.sizes && item.sizes.length ? item.sizes[0] : null;
}

function getDefaultStyle(item) {
  return item.styles && item.styles.length ? item.styles[0] : null;
}

function calculateItemPrice(item, variant, size, style) {
  const variantExtra = variant?.extra || 0;
  const styleExtra = style?.extra || 0;
  const sizePrice = Number(size?.price || item.basePrice || 0);
  return sizePrice + variantExtra + styleExtra;
}

function formatCategoryLabel(category) {
  if (!category || category === 'All') return category;
  return category === 'momo' ? 'Momo' : category;
}

function getCategories(items) {
  const categories = ['All'];
  items.forEach((item) => {
    if (item.isActive !== false && !categories.includes(item.category)) {
      categories.push(item.category);
    }
  });
  return categories;
}

function renderCategoryFilters() {
  const categories = getCategories(state.menu);

  categoryFilters.innerHTML = categories
    .map(
      (category) => `
        <button
          type="button"
          class="filter-btn ${state.activeCategory === category ? 'active' : ''}"
          data-category="${category}"
        >
          ${formatCategoryLabel(category)}
        </button>
      `
    )
    .join('');

  document.querySelectorAll('.filter-btn').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeCategory = button.dataset.category;
      renderCategoryFilters();
      renderMenu();
    });
  });
}

function getItemGroup(item) {
  const name = (item.name || '').toLowerCase();
  const tags = (item.tags || []).map((tag) => tag.toLowerCase());

  if (tags.some((tag) => tag.includes('non-veg') || tag.includes('non veg') || tag.includes('seafood'))) return 'Non-Veg';
  if (name.includes('chicken') || name.includes('goat') || name.includes('salmon') || name.includes('fish')) return 'Non-Veg';
  if (tags.some((tag) => tag.includes('veg') || tag.includes('vegetarian'))) return 'Veg';

  return 'Veg';
}

function renderMenu() {
  const filteredMenu = state.menu.filter((item) => {
    if (item.isActive === false) return false;
    return state.activeCategory === 'All' || item.category === state.activeCategory;
  });

  if (!filteredMenu.length) {
    menuGrid.innerHTML = '<div class="empty-cart">No menu items available in this category right now.</div>';
    return;
  }

  const groupedMenu = filteredMenu.reduce((groups, item) => {
    const category = item.category;
    const group = getItemGroup(item);

    if (!groups[category]) {
      groups[category] = {
        Veg: [],
        'Non-Veg': []
      };
    }

    if (!groups[category][group]) {
      groups[category][group] = [];
    }

    groups[category][group].push(item);
    return groups;
  }, {});

  menuGrid.innerHTML = Object.entries(groupedMenu)
    .map(([category, groups]) => {
      const subgroupOrder = ['Veg', 'Non-Veg'];
      const subgroupMarkup = subgroupOrder
        .filter((groupName) => groups[groupName] && groups[groupName].length)
        .map((groupName) => `
          <div class="menu-subgroup">
            <h4 class="menu-subgroup-heading">${groupName}</h4>
            <div class="menu-group-items">
              ${groups[groupName]
                .map((item) => {
                  const defaultVariant = getDefaultVariant(item);
                  const defaultSize = getDefaultSize(item);
                  const defaultStyle = getDefaultStyle(item);
                  const startingPrice = calculateItemPrice(item, defaultVariant, defaultSize, defaultStyle);

                  return `
                    <article class="menu-card">
                      <div class="menu-card-image" aria-hidden="true"></div>
                      <div class="menu-card-body">
                        <div class="menu-card-head">
                          <h3>${item.name}</h3>
                        </div>

                        <p>${item.description}</p>

                        <div class="item-meta">
                          ${(item.tags || []).map((tag) => `<span class="meta-chip">${tag}</span>`).join('')}
                        </div>

                        <div class="menu-card-footer">
                          <span class="price-tag">From ${formatCurrency(startingPrice)}</span>
                          <button class="add-btn customize-btn" type="button" data-customize-id="${item.id}">Customize</button>
                        </div>
                      </div>
                    </article>
                  `;
                })
                .join('')}
            </div>
          </div>
        `)
        .join('');

      return `
        <section class="menu-group">
          <h3 class="menu-group-heading">${formatCategoryLabel(category)}</h3>
          ${subgroupMarkup}
        </section>
      `;
    })
    .join('');

  document.querySelectorAll('.customize-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const item = state.menu.find((entry) => entry.id === button.dataset.customizeId);
      if (item) {
        openCustomizer(item);
      }
    });
  });
}

function fillSelectOptions(select, options, valueKey, labelKey, extraKey) {
  select.innerHTML = options
    .map((option) => {
      const label = option[labelKey];
      const extra = option[extraKey] ? ` (+${formatCurrency(option[extraKey])})` : '';
      return `<option value="${option[valueKey]}">${label}${extra}</option>`;
    })
    .join('');
}

function fillSizeOptions(select, options) {
  select.innerHTML = options
    .map((option) => {
      const pcsValue = option.pcs == null ? '' : String(option.pcs).trim();
      const pcsText = pcsValue ? ` (${pcsValue})` : '';
      const priceText = option.price != null ? ` ($${Number(option.price).toFixed(2)})` : '';
      return `<option value="${option.label}">${option.label}${pcsText}${priceText}</option>`;
    })
    .join('');
}

function updateCustomizerDetails() {
  if (!state.currentItem) return;

  const item = state.currentItem;
  const selectedStyle = (item.styles || []).find((option) => option.name === modalStyle.value) || getDefaultStyle(item);
  const selectedSize = (item.sizes || []).find((option) => option.label === modalSize.value) || getDefaultSize(item);

  const total = calculateItemPrice(item, getDefaultVariant(item), selectedSize, selectedStyle) * Number(modalQty.value || 1);
  modalPrice.textContent = formatCurrency(total);
}

function toggleModalNotePanel(forceOpen) {
  if (!modalNotePanel) return;
  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : modalNotePanel.classList.contains('hidden');
  modalNotePanel.classList.toggle('hidden', !shouldOpen);

  const toggleButton = document.querySelector('[data-note-toggle-modal]');
  if (toggleButton) {
    toggleButton.textContent = shouldOpen ? 'Hide Instructions' : 'Add Instructions';
  }
}

function openCustomizer(item) {
  state.currentItem = item;
  state.currentCartIndex = null;
  customizerTitle.textContent = item.name;
  customizerDescription.textContent = item.description;
  const styleOptions = item.styles || [{ name: 'Standard', extra: 0 }];
  const sizeOptions = item.sizes || [{ label: 'Standard', price: item.basePrice || 0, serves: '', pcs: '' }];

  fillSelectOptions(modalStyle, styleOptions, 'name', 'name', 'extra');
  fillSizeOptions(modalSize, sizeOptions);

  modalStyle.value = getDefaultStyle(item)?.name || styleOptions[0].name;
  modalSize.value = getDefaultSize(item)?.label || sizeOptions[0].label;

  modalQty.value = 1;
  modalNote.value = '';
  toggleModalNotePanel(false);
  document.getElementById('addModalToCart').textContent = 'Add to Cart';
  updateCustomizerDetails();
  customizerModal.classList.remove('hidden');
  customizerModal.setAttribute('aria-hidden', 'false');
}

function openCartItemEditor(index) {
  const item = cart[index];
  if (!item) return;

  const menuItem = state.menu.find((entry) => entry.id === item.itemId);
  if (!menuItem) return;

  state.currentItem = menuItem;
  state.currentCartIndex = index;
  customizerTitle.textContent = item.name;
  customizerDescription.textContent = menuItem.description;

  const styleOptions = menuItem.styles || [{ name: 'Standard', extra: 0 }];
  const sizeOptions = menuItem.sizes || [{ label: 'Standard', price: menuItem.basePrice || 0, serves: '', pcs: '' }];

  fillSelectOptions(modalStyle, styleOptions, 'name', 'name', 'extra');
  fillSizeOptions(modalSize, sizeOptions);

  modalStyle.value = item.style || styleOptions[0].name;
  modalSize.value = item.size || sizeOptions[0].label;
  modalQty.value = item.quantity;
  modalNote.value = item.note || '';
  toggleModalNotePanel(Boolean(item.note && item.note.trim()));
  document.getElementById('addModalToCart').textContent = 'Update Item';
  updateCustomizerDetails();
  customizerModal.classList.remove('hidden');
  customizerModal.setAttribute('aria-hidden', 'false');
}

function closeCustomizer() {
  state.currentCartIndex = null;
  state.currentItem = null;
  if (modalNote) modalNote.value = '';
  toggleModalNotePanel(false);
  document.getElementById('addModalToCart').textContent = 'Add to Cart';
  customizerModal.classList.add('hidden');
  customizerModal.setAttribute('aria-hidden', 'true');
}

function renderReviewModal() {
  if (!reviewOrderSummary || !reviewSubtotal) return;

  const name = document.getElementById('customerName')?.value.trim() || 'Not provided';
  const phone = document.getElementById('customerPhone')?.value.trim() || 'Not provided';
  const eventDate = document.getElementById('eventDate')?.value || 'Not provided';
  const guestCount = document.getElementById('guestCount')?.value.trim() || 'Not provided';
  const serviceTime = document.getElementById('serviceTime')?.value || 'Not provided';
  const orderType = document.getElementById('orderType')?.value || 'Pickup';
  const deliveryAddress = document.getElementById('deliveryAddress')?.value.trim() || 'Not provided';
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const itemsHtml = cart.length
    ? cart
        .map(
          (item, index) => `
            <div class="review-item-row">
              <div>
                <strong>${index + 1}. ${item.name}</strong>
                <div class="review-item-meta">${item.variant} • ${item.style} • ${getDisplaySizeLabel(item)}</div>
                ${item.note ? `<div class="review-item-note">Note: ${item.note}</div>` : ''}
              </div>
              <div class="review-item-total">
                <span>${item.quantity}x</span>
                <strong>${formatCurrency(item.price * item.quantity)}</strong>
              </div>
            </div>
          `
        )
        .join('')
    : '<p class="review-empty">Your cart is empty.</p>';

  const pickupLocation = '120 Cedar Grove Ln, Somerset, NJ 08873';

  reviewOrderSummary.innerHTML = `
    <div class="review-block review-block--details">
      <h4>Order details</h4>
      <div class="review-line"><span>Customer</span><strong>${name}</strong></div>
      <div class="review-line"><span>Phone</span><strong>${phone}</strong></div>
      <div class="review-line"><span>Event date</span><strong>${eventDate}</strong></div>
      <div class="review-line"><span>Headcount</span><strong>${guestCount}</strong></div>
      <div class="review-line"><span>Time</span><strong>${serviceTime}</strong></div>
      <div class="review-line"><span>Order type</span><strong>${orderType}</strong></div>
      ${orderType === 'Pickup' ? `<div class="review-line review-address"><span>Pickup address</span><strong>${pickupLocation}</strong></div>` : ''}
      ${orderType === 'Delivery' ? `<div class="review-line review-address"><span>Delivery address</span><strong>${deliveryAddress}</strong></div>` : ''}
    </div>

    <div class="review-block review-block--items">
      <h4>Items</h4>
      ${itemsHtml}
    </div>
  `;

  reviewSubtotal.textContent = formatCurrency(subtotal);
}

function openReviewModal() {
  if (!reviewModal) return;
  renderReviewModal();
  reviewModal.classList.remove('hidden');
  reviewModal.setAttribute('aria-hidden', 'false');
}

function closeReviewModal() {
  if (!reviewModal) return;
  reviewModal.classList.add('hidden');
  reviewModal.setAttribute('aria-hidden', 'true');
}

function addItemFromCustomizer() {
  if (!state.currentItem) return;

  const item = state.currentItem;
  const selectedStyle = (item.styles || []).find((option) => option.name === modalStyle.value) || getDefaultStyle(item);
  const selectedSize = (item.sizes || []).find((option) => option.label === modalSize.value) || getDefaultSize(item);
  const quantity = Math.max(1, Number(modalQty.value) || 1);
  const note = (modalNote?.value || '').trim();
  const price = calculateItemPrice(item, getDefaultVariant(item), selectedSize, selectedStyle);

  if (state.currentCartIndex !== null && cart[state.currentCartIndex]) {
    cart[state.currentCartIndex] = {
      ...cart[state.currentCartIndex],
      style: selectedStyle?.name || 'Standard',
      size: selectedSize?.label || 'Standard',
      serves: selectedSize?.serves || '',
      pcs: selectedSize?.pcs || '',
      price,
      quantity,
      note
    };
  } else {
    cart.push({
      id: `${item.id}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      itemId: item.id,
      name: item.name,
      variant: getDefaultVariant(item)?.name || 'Regular',
      style: selectedStyle?.name || 'Standard',
      size: selectedSize?.label || 'Standard',
      serves: selectedSize?.serves || '',
      pcs: selectedSize?.pcs || '',
      price,
      quantity,
      note
    });
  }

  renderCart();
  closeCustomizer();
}

function renderCart() {
  if (!cart.length) {
    emptyCart.style.display = 'block';
    cartItemsEl.innerHTML = '';
    subtotalValue.textContent = formatCurrency(0);
    cartCount.textContent = 0;
    return;
  }

  emptyCart.style.display = 'none';
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  subtotalValue.textContent = formatCurrency(subtotal);

  cartItemsEl.innerHTML = cart
    .map(
      (item, index) => `
        <div class="cart-item" tabindex="0" data-edit-index="${index}">
          <div class="cart-item-main">
            <h4>${item.name}</h4>

            <div class="item-actions-inline">
              <div class="qty-controls">
                <button class="qty-button" type="button" data-qty-action="decrease" data-index="${index}" aria-label="Decrease quantity">−</button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-button" type="button" data-qty-action="increase" data-index="${index}" aria-label="Increase quantity">+</button>
              </div>

              <span class="item-price">${formatCurrency(item.price * item.quantity)}</span>

              <div class="mini-actions">
                <button class="icon-btn" type="button" data-edit-index="${index}" aria-label="Edit item">✎</button>
                <button class="icon-btn danger" type="button" data-remove-index="${index}" aria-label="Remove item">×</button>
              </div>
            </div>
          </div>

          <div class="item-detail">
            ${item.variant} • ${item.style} • ${item.size}
            ${item.serves ? ` • ${item.serves}` : ''}
            ${item.pcs ? ` • ${item.pcs}` : ''}
          </div>

          <button class="note-toggle" type="button" data-note-toggle-index="${index}">
            ${item.note ? 'Edit Instructions' : 'Add Instructions'}
          </button>

          <div class="item-note-panel hidden">
            <label class="item-note-label" for="note-${index}">Special Instructions</label>
            <textarea id="note-${index}" data-note-index="${index}" rows="2" placeholder="Add a special instruction...">${item.note || ''}</textarea>
          </div>
        </div>
      `
    )
    .join('');

  document.querySelectorAll('[data-remove-index]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const index = Number(button.dataset.removeIndex);
      cart.splice(index, 1);
      renderCart();
    });
  });

  document.querySelectorAll('[data-edit-index]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const index = Number(button.dataset.editIndex);
      openCartItemEditor(index);
    });
  });

  document.querySelectorAll('[data-qty-action]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const index = Number(button.dataset.index);
      const action = button.dataset.qtyAction;

      if (action === 'increase') {
        cart[index].quantity += 1;
      } else if (action === 'decrease') {
        if (cart[index].quantity > 1) {
          cart[index].quantity -= 1;
        }
      }

      renderCart();
    });
  });

  document.querySelectorAll('[data-note-index]').forEach((textarea) => {
    textarea.addEventListener('input', (event) => {
      const index = Number(event.target.dataset.noteIndex);
      cart[index].note = event.target.value;
      const noteToggle = event.target.closest('.cart-item')?.querySelector('.note-toggle');
      if (noteToggle) {
        noteToggle.textContent = event.target.value.trim() ? 'Edit Instructions' : 'Add Instructions';
      }
    });
  });

  document.querySelectorAll('[data-note-toggle-index]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const index = Number(button.dataset.noteToggleIndex);
      const itemCard = button.closest('.cart-item');
      const notePanel = itemCard?.querySelector('.item-note-panel');
      if (!notePanel) return;
      const isHidden = notePanel.classList.toggle('hidden');
      if (isHidden) {
        button.textContent = cart[index]?.note ? 'Edit Instructions' : 'Add Instructions';
      } else {
        button.textContent = 'Hide Instructions';
      }
    });
  });
}

function openCart() {
  cartPanel.classList.add('open');
}

function closeCart() {
  cartPanel.classList.remove('open');
}

function toggleOrderDetails() {
  const orderType = document.getElementById('orderType');
  const deliveryAddressBlock = document.getElementById('deliveryAddressBlock');
  if (!orderType || !deliveryAddressBlock) return;

  const isDelivery = orderType.value === 'Delivery';
  deliveryAddressBlock.classList.toggle('hidden-field', !isDelivery);
}

function prepareWhatsAppMessage() {
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const eventDate = document.getElementById('eventDate').value;
  const guestCount = document.getElementById('guestCount').value.trim();
  const serviceTime = document.getElementById('serviceTime').value;
  const orderType = document.getElementById('orderType').value;
  const deliveryAddress = document.getElementById('deliveryAddress')?.value.trim() || '';

  if (!name || !phone) {
    alert('Please enter your name and phone number before placing the order.');
    return null;
  }

  if (!cart.length) {
    alert('Your cart is empty. Please add at least one item.');
    return null;
  }

  if (orderType === 'Delivery' && !deliveryAddress) {
    alert('Please enter the delivery address before placing a delivery order.');
    return null;
  }

  const lines = cart.map((item, index) => {
    const noteText = item.note ? `   _Note:_ ${item.note}` : '';
    return [
      `*${index + 1}) ${item.name}*`,
      `   Style: ${item.style}`,
      `   Size: ${getDisplaySizeLabel(item)}`,
      `   Qty: ${item.quantity}`,
      `   Price: ${formatCurrency(item.price * item.quantity)}`,
      noteText
    ].filter(Boolean).join('\n');
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const pickupLocation = '120 Cedar Grove Ln, Somerset, NJ 08873';
  const message = [
    '*Hello, I would like to place an order.*',
    '',
    '*Customer Details*',
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Order Type: ${orderType}`,
    `Headcount: ${guestCount || 'Not provided'}`,
    `Event Date: ${eventDate || 'Not provided'}`,
    `Preferred Time: ${serviceTime || 'Not provided'}`,
    orderType === 'Pickup' ? `Pickup Address: ${pickupLocation}` : '',
    orderType === 'Delivery' ? `Delivery Address: ${deliveryAddress || 'Not provided'}` : '',
    '',
    '*Order Summary*',
    ...lines,
    '',
    `*Total:* ${formatCurrency(subtotal)}`
  ].filter(Boolean).join('\n');

  return message;
}

function sendOrderToWhatsApp() {
  const message = prepareWhatsAppMessage();
  if (!message) return;

  const encodedMessage = encodeURIComponent(message);
  const whatsappNumber = '19293931494';
  const url = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
  window.open(url, '_blank');
}

async function loadMenu() {
  try {
    const response = await fetch('./data/menu.json');
    if (!response.ok) {
      throw new Error('Menu JSON not found');
    }
    const data = await response.json();
    state.menu = data.filter(Boolean);
  } catch (error) {
    console.error('Falling back to default menu data:', error);
    state.menu = [
      {
        id: 'veg-momos',
        name: 'Veg Momo',
        category: 'momo',
        emoji: '🥟',
        description: 'Soft steamed vegetable dumplings served with spicy chutney.',
        tags: ['Best Seller', 'Veg'],
        isActive: true,
        variants: [{ name: 'Veg', extra: 0 }],
        styles: [{ name: 'Steamed', extra: 0 }, { name: 'Fried', extra: 25 }],
        sizes: [
          { label: 'Half Size', serves: 'Serves 20 people', pcs: '40 pcs', price: 1200 },
          { label: 'Full Size', serves: 'Serves 40 people', pcs: '80 pcs', price: 2200 }
        ]
      },
      {
        id: 'chicken-momos',
        name: 'Chicken Momo',
        category: 'momo',
        emoji: '🥟',
        description: 'Juicy chicken steamed dumplings with smoky chutney.',
        tags: ['Popular', 'Non-Veg'],
        isActive: true,
        variants: [{ name: 'Chicken', extra: 0 }, { name: 'Chicken Tandoori', extra: 60 }],
        styles: [{ name: 'Steamed', extra: 0 }, { name: 'Fried', extra: 35 }],
        sizes: [
          { label: 'Half Size', serves: 'Serves 20 people', pcs: '40 pcs', price: 1500 },
          { label: 'Full Size', serves: 'Serves 40 people', pcs: '80 pcs', price: 2800 }
        ]
      },
      {
        id: 'paneer-tikka',
        name: 'Paneer Tikka Platter',
        category: 'Starters',
        emoji: '🍢',
        description: 'Char-grilled cottage cheese with mint dip.',
        tags: ['Party Favorite', 'Veg'],
        isActive: true,
        variants: [{ name: 'Paneer', extra: 0 }],
        styles: [{ name: 'Classic', extra: 0 }, { name: 'Spicy', extra: 20 }],
        sizes: [
          { label: 'Half Tray', serves: 'Serves 20 people', pcs: '30 pcs', price: 1800 },
          { label: 'Full Tray', serves: 'Serves 40 people', pcs: '60 pcs', price: 3200 }
        ]
      },
      {
        id: 'veg-biryani',
        name: 'Veg Biryani',
        category: 'Main Course',
        emoji: '🍚',
        description: 'Aromatic rice with vegetables, herbs, and dum-cooked flavor.',
        tags: ['Family Pack', 'Veg'],
        isActive: true,
        variants: [{ name: 'Veg', extra: 0 }, { name: 'Paneer', extra: 80 }],
        styles: [{ name: 'Classic', extra: 0 }, { name: 'Extra Spicy', extra: 30 }],
        sizes: [
          { label: 'Half Size', serves: 'Serves 20 people', pcs: '40 portions', price: 1700 },
          { label: 'Full Size', serves: 'Serves 40 people', pcs: '80 portions', price: 3100 }
        ]
      },
      {
        id: 'chicken-biryani',
        name: 'Chicken Biryani',
        category: 'Main Course',
        emoji: '🍛',
        description: 'Fragrant basmati rice layered with juicy chicken.',
        tags: ['Most Loved', 'Non-Veg'],
        isActive: true,
        variants: [{ name: 'Chicken', extra: 0 }],
        styles: [{ name: 'Regular', extra: 0 }, { name: 'Extra Spicy', extra: 30 }],
        sizes: [
          { label: 'Half Size', serves: 'Serves 20 people', pcs: '40 portions', price: 2100 },
          { label: 'Full Size', serves: 'Serves 40 people', pcs: '80 portions', price: 3900 }
        ]
      },
      {
        id: 'dal-makhani',
        name: 'Dal Makhani',
        category: 'Main Course',
        emoji: '🥘',
        description: 'Slow-cooked black lentils with cream, butter, and spices.',
        tags: ['Comfort Food', 'Veg'],
        isActive: true,
        variants: [{ name: 'Classic', extra: 0 }],
        styles: [{ name: 'Regular', extra: 0 }, { name: 'Extra Creamy', extra: 40 }],
        sizes: [
          { label: 'Half Size', serves: 'Serves 20 people', pcs: '40 portions', price: 1400 },
          { label: 'Full Size', serves: 'Serves 40 people', pcs: '80 portions', price: 2600 }
        ]
      }
    ];
  }

  renderCategoryFilters();
  renderMenu();
}

function bindControls() {
  const scrollTrigger = document.querySelector('[data-scroll-target="#menu"]');

  document.getElementById('cartToggle')?.addEventListener('click', openCart);
  document.getElementById('closeCart')?.addEventListener('click', closeCart);
  document.getElementById('closeCustomizer')?.addEventListener('click', closeCustomizer);
  document.getElementById('closeReviewModal')?.addEventListener('click', closeReviewModal);
  document.getElementById('addModalToCart')?.addEventListener('click', addItemFromCustomizer);
  document.getElementById('reviewOrderButton')?.addEventListener('click', () => {
    if (!cart.length) {
      alert('Your cart is empty. Please add at least one item first.');
      return;
    }
    openReviewModal();
  });
  document.getElementById('confirmReviewOrder')?.addEventListener('click', () => {
    closeReviewModal();
    sendOrderToWhatsApp();
  });
  document.querySelector('[data-note-toggle-modal]')?.addEventListener('click', () => {
    toggleModalNotePanel();
  });
  document.getElementById('orderButton')?.addEventListener('click', sendOrderToWhatsApp);
  document.getElementById('orderType')?.addEventListener('change', toggleOrderDetails);
  reviewModal?.addEventListener('click', (event) => {
    if (event.target === reviewModal) {
      closeReviewModal();
    }
  });
  toggleOrderDetails();

  if (scrollTrigger) {
    scrollTrigger.addEventListener('click', () => {
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  [modalStyle, modalSize, modalQty].forEach((element) => {
    if (!element) return;
    element.addEventListener('input', updateCustomizerDetails);
    element.addEventListener('change', updateCustomizerDetails);
  });

  customizerModal?.addEventListener('click', (event) => {
    if (event.target === customizerModal) {
      closeCustomizer();
    }
  });

}

bindControls();
loadMenu();
