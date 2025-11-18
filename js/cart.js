$(document).ready(function() {
    let cart = [];

    // --- INITIALIZATION ---
    loadCart();
    renderCartPage();
    updateCartBadge();

    // --- RENDER FUNCTIONS ---
    function renderCartPage() {
        const $container = $('#cart-page-container');
        $container.empty().addClass('cart-page-container');

        if (cart.length === 0) {
            $container.html(`
                <div class="col-12 text-center">
                    <div class="cart-card p-5">
                        <h2 class="mb-3">Tu carrito está vacío</h2>
                        <p class="text-muted">Parece que aún no has añadido ningún servicio.</p>
                        <div class="mt-3">
                            <a href="index.html" class="btn btn-primary">Explorar Servicios</a>
                        </div>
                    </div>
                </div>
            `);
            $container.removeClass('cart-page-container'); // Remove grid layout for single card
            return;
        }

        const productItemsHTML = cart.map(item => `
            <div class="product" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}">
                <div class="product-details">
                    <div class="product-row-top">
                        <div class="name-container">
                          <span class="name">${item.name}</span>
                        </div>
                        <label class="price small">$${(item.price * item.quantity).toFixed(2)}</label>
                    </div>
                    <div class="product-row-bottom">
                        <div class="quantity">
                          <button class="decrease-qty-btn">
                            <svg fill="none" viewBox="0 0 24 24" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
                              <path stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" d="M20 12L4 12"></path>
                            </svg>
                          </button>
                          <label class="qty-label">${item.quantity}</label>
                          <button class="increase-qty-btn">
                            <svg fill="none" viewBox="0 0 24 24" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
                              <path stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" d="M12 4V20M20 12H4"></path>
                            </svg>
                          </button>
                        </div>
                        <button class="remove-item-btn">
                           <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const cartHTML = `
            <div class="cart-card cart">
                <label class="title">Tu Carrito</label>
                <div class="products">
                    ${productItemsHTML}
                </div>
            </div>
        `;

        const checkoutHTML = `
            <div class="cart-card checkout">
                <label class="title">Checkout</label>
                <div class="details">
                  <span>Subtotal:</span>
                  <span>$${total.toFixed(2)}</span>
                  <span>Cargos de servicio:</span>
                  <span>$0.00</span>
                </div>
                <div class="checkout--footer">
                  <label class="price-total"><sup>$</sup>${total.toFixed(2)}</label>
                  <button class="checkout-btn">Confirmar Pedido</button>
                </div>
            </div>
        `;
        
        $container.html('<div>' + cartHTML + '</div>' + '<div class="summary-container">' + checkoutHTML + '</div>');
    }

    function updateCartBadge() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const $badge = $('#cart-badge');
        if (totalItems > 0) {
            $badge.text(totalItems).show();
        } else {
            $badge.hide();
        }
    }

    // --- CART LOGIC ---
    function updateQuantity(serviceId, change) {
        const cartItem = cart.find(item => item.id === serviceId);
        if (cartItem) {
            cartItem.quantity += change;
            if (cartItem.quantity <= 0) {
                removeFromCart(serviceId);
            } else {
                saveCart();
                renderCartPage();
                updateCartBadge();
            }
        }
    }

    function removeFromCart(serviceId) {
        cart = cart.filter(item => item.id !== serviceId);
        saveCart();
        renderCartPage();
        updateCartBadge();
    }

    // --- LOCALSTORAGE ---
    function saveCart() {
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
    }

    function loadCart() {
        const savedCart = localStorage.getItem('shoppingCart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    }
    
    // --- EVENT HANDLERS ---
    $('#cart-page-container').on('click', '.increase-qty-btn', function() {
        const serviceId = $(this).closest('.product').data('id');
        updateQuantity(serviceId, 1);
    });

    $('#cart-page-container').on('click', '.decrease-qty-btn', function() {
        const serviceId = $(this).closest('.product').data('id');
        updateQuantity(serviceId, -1);
    });

    $('#cart-page-container').on('click', '.remove-item-btn', function() {
        const serviceId = $(this).closest('.product').data('id');
        removeFromCart(serviceId);
    });

    $('#cart-page-container').on('click', '.checkout-btn', function() {
        const $summary = $('#order-summary');
        $summary.empty();
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cart.forEach(item => {
            $summary.append(`<p>${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}</p>`);
        });
        $summary.append(`<hr><p class="fw-bold">Total a Pagar: $${total.toFixed(2)}</p>`);
        const orderModal = new bootstrap.Modal($('#order-modal'));
        orderModal.show();
    });

    $('#confirm-purchase-btn').on('click', function() {
        cart = [];
        saveCart();
        renderCartPage();
        updateCartBadge();
        const orderModal = bootstrap.Modal.getInstance($('#order-modal'));
        orderModal.hide();
        
        $('#success-alert').fadeIn(500).delay(3000).fadeOut(500);
    });
    
    $('#theme-toggler').on('click', function() {
        // Target 'html' to be consistent with the FOUC script
        $('html').toggleClass('dark-mode');
        const icon = $(this).find('i');

        if ($('html').hasClass('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            icon.removeClass('fa-moon').addClass('fa-sun');
        } else {
            localStorage.setItem('theme', 'light');
            icon.removeClass('fa-sun').addClass('fa-moon');
        }
    });
});
