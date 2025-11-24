import { supabase } from './supabase-client.js';

$(document).ready(function() {
    let cart = [];
    let currentUser = null;

    // --- INITIALIZATION ---
    async function initializePage() {
        initializeTheme();

        const { data: { session } } = await supabase.auth.getSession();
        currentUser = session?.user || null;
        updateUserNav(currentUser);
        await renderCartPage(); // This now also fetches the cart

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            currentUser = session?.user || null;
            updateUserNav(currentUser);
            await renderCartPage(); // Re-render the cart when auth state changes
        });
    }

    initializePage();

    // --- AUTHENTICATION ---
    function updateUserNav(user) {
        const $nav = $('#user-session-nav');
        if (user) {
            $nav.html(`
                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    ${user.email}
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                    <li><a class="dropdown-item" href="#" id="logout-btn">Cerrar Sesión</a></li>
                </ul>
            `);
        } else {
            $nav.html(`
                <div class="d-flex">
                    <button class="btn btn-primary me-2" data-bs-toggle="modal" data-bs-target="#login-modal">Iniciar Sesión</button>
                    <button class="btn btn-outline-light" data-bs-toggle="modal" data-bs-target="#register-modal">Registrarse</button>
                </div>
            `);
        }
    }

    $('#login-form').on('submit', async function(e) {
        e.preventDefault();
        const email = $('#login-email').val();
        const password = $('#login-password').val();
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            bootstrap.Modal.getInstance($('#login-modal')).hide();
        } catch (error) {
            $('#login-error-msg').text(error.message).show();
        }
    });

    $('#register-form').on('submit', async function(e) {
        e.preventDefault();
        const email = $('#register-email').val();
        const password = $('#register-password').val();
        try {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            $('#register-error-msg').hide();
            $('#register-success-msg').text('¡Registro exitoso! Por favor, inicia sesión.').show();
        } catch (error) {
            $('#register-success-msg').hide();
            $('#register-error-msg').text(error.message).show();
        }
    });

    $('body').on('click', '#logout-btn', async function(e) {
        e.preventDefault();
        await supabase.auth.signOut();
    });

    // --- RENDER & CART LOGIC (DATABASE) ---
    async function renderCartPage() {
        const $container = $('#cart-page-container');
        $container.empty().addClass('cart-page-container');

        if (!currentUser) {
            $container.html(`
                <div class="col-12 text-center">
                    <div class="cart-card p-5">
                        <h2 class="mb-3">Tu carrito está vacío</h2>
                        <p class="text-muted">Inicia sesión para ver los artículos de tu carrito.</p>
                        <div class="mt-3">
                            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#login-modal">Iniciar Sesión</button>
                        </div>
                    </div>
                </div>
            `);
            $container.removeClass('cart-page-container');
            updateCartBadge([]); // Pass empty array to clear badge
            return;
        }

        try {
            const { data, error } = await supabase
                .from('cart_items')
                .select('product_id, quantity, products (*)')
                .eq('user_id', currentUser.id);

            if (error) throw error;

            cart = data.map(item => ({ ...item.products, quantity: item.quantity }));
            updateCartBadge(cart);

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
                $container.removeClass('cart-page-container');
                return;
            }

            const productItemsHTML = cart.map(item => `
                <div class="product" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="product-details">
                        <div class="product-row-top">
                            <div class="name-container"><span class="name">${item.name}</span></div>
                            <label class="price small">$${(item.price * item.quantity).toFixed(2)}</label>
                        </div>
                        <div class="product-row-bottom">
                            <div class="quantity">
                                <button class="decrease-qty-btn"><i class="fas fa-minus"></i></button>
                                <label class="qty-label">${item.quantity}</label>
                                <button class="increase-qty-btn"><i class="fas fa-plus"></i></button>
                            </div>
                            <button class="remove-item-btn"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>`).join('');

            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            const cartHTML = `<div class="cart-card cart"><label class="title">Tu Carrito</label><div class="products">${productItemsHTML}</div></div>`;
            const checkoutHTML = `
                <div class="cart-card checkout">
                    <label class="title">Checkout</label>
                    <div class="details">
                        <span>Subtotal:</span><span>$${total.toFixed(2)}</span>
                        <span>Cargos de servicio:</span><span>$0.00</span>
                    </div>
                    <div class="checkout--footer">
                        <label class="price-total"><sup>$</sup>${total.toFixed(2)}</label>
                        <button class="checkout-btn">Confirmar Pedido</button>
                    </div>
                </div>`;
            
            $container.html('<div>' + cartHTML + '</div>' + '<div class="summary-container">' + checkoutHTML + '</div>');

        } catch (error) {
            console.error("Error rendering cart:", error.message);
            $container.html('<div class="col-12 text-center"><p class="text-danger">Error al cargar el carrito.</p></div>');
        }
    }

    function updateCartBadge(currentCart) {
        const totalItems = (currentCart || []).reduce((sum, item) => sum + item.quantity, 0);
        const $badge = $('#cart-badge');
        if (totalItems > 0) {
            $badge.text(totalItems).show();
        } else {
            $badge.hide();
        }
    }

    async function updateItemQuantity(productId, newQuantity) {
        if (!currentUser) return;
        try {
            const { error } = await supabase
                .from('cart_items')
                .update({ quantity: newQuantity })
                .match({ user_id: currentUser.id, product_id: productId });
            if (error) throw error;
            await renderCartPage();
        } catch (error) {
            console.error("Error updating quantity:", error.message);
        }
    }

    async function removeItem(productId) {
        if (!currentUser) return;
        try {
            const { error } = await supabase
                .from('cart_items')
                .delete()
                .match({ user_id: currentUser.id, product_id: productId });
            if (error) throw error;
            await renderCartPage();
        } catch (error) {
            console.error("Error removing item:", error.message);
        }
    }
    
    // --- EVENT HANDLERS ---
    $('#cart-page-container').on('click', '.increase-qty-btn', function() {
        const productId = $(this).closest('.product').data('id');
        const item = cart.find(i => i.id === productId);
        if (item) updateItemQuantity(productId, item.quantity + 1);
    });

    $('#cart-page-container').on('click', '.decrease-qty-btn', function() {
        const productId = $(this).closest('.product').data('id');
        const item = cart.find(i => i.id === productId);
        if (item && item.quantity > 1) {
            updateItemQuantity(productId, item.quantity - 1);
        } else if (item) {
            removeItem(productId);
        }
    });

    $('#cart-page-container').on('click', '.remove-item-btn', function() {
        const productId = $(this).closest('.product').data('id');
        removeItem(productId);
    });

    $('#cart-page-container').on('click', '.checkout-btn', function() {
        // This part remains the same as it just populates a modal
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

    $('#confirm-purchase-btn').on('click', async function() {
        if (!currentUser) return;
        try {
            // Clear the cart in the database
            const { error } = await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', currentUser.id);
            if (error) throw error;
            
            await renderCartPage(); // Re-render the now-empty cart
            
            const orderModal = bootstrap.Modal.getInstance($('#order-modal'));
            orderModal.hide();
            $('#success-alert').fadeIn(500).delay(3000).fadeOut(500);

        } catch (error) {
            console.error("Error confirming purchase:", error.message);
        }
    });
    
    // --- THEME ---
    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
    }
    function applyTheme(theme) {
        const icon = $('#theme-toggler').find('i');
        if (theme === 'dark') {
            $('html').addClass('dark-mode');
            icon.removeClass('fa-moon').addClass('fa-sun');
        } else {
            $('html').removeClass('dark-mode');
            icon.removeClass('fa-sun').addClass('fa-moon');
        }
    }
    $('#theme-toggler').on('click', function() {
        const newTheme = $('html').hasClass('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });
});
