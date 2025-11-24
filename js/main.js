import { supabase } from './supabase-client.js';

$(document).ready(function () {

    // --- GLOBAL STATE ---
    let allServices = []; // This will hold the services fetched from Supabase
    let cart = []; // This will hold the user's cart from the DB
    let currentUser = null;

    // --- INITIALIZATION ---
    async function initializePage() {
        await fetchAndRenderServices();
        initializeTheme();
        
        const { data: { session } } = await supabase.auth.getSession();
        currentUser = session?.user || null;
        updateUserNav(currentUser);
        await loadCartFromDB(currentUser);

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            currentUser = session?.user || null;
            updateUserNav(currentUser);
            // When user logs in or out, reload the cart
            await loadCartFromDB(currentUser);
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
        const $errorMsg = $('#login-error-msg');

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            bootstrap.Modal.getInstance($('#login-modal')).hide();
        } catch (error) {
            $errorMsg.text(error.message).show();
        }
    });

    $('#register-form').on('submit', async function(e) {
        e.preventDefault();
        const email = $('#register-email').val();
        const password = $('#register-password').val();
        const $errorMsg = $('#register-error-msg');
        const $successMsg = $('#register-success-msg');

        try {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            $errorMsg.hide();
            $successMsg.text('¡Registro exitoso! Por favor, inicia sesión.').show();
            setTimeout(() => {
                bootstrap.Modal.getInstance($('#register-modal')).hide();
                bootstrap.Modal.getInstance($('#login-modal')).show();
            }, 2000);
        } catch (error) {
            $successMsg.hide();
            $errorMsg.text(error.message).show();
        }
    });

    $('body').on('click', '#logout-btn', async function(e) {
        e.preventDefault();
        await supabase.auth.signOut();
    });


    // --- DATA FETCHING ---
    async function fetchAndRenderServices() {
        // ... (this function remains the same)
        const $serviceList = $('#service-list');
        try {
            $serviceList.html('<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>');
            const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
            if (error) throw error;
            allServices = data;
            renderServices(allServices);
        } catch (error) {
            console.error('Error fetching services:', error.message);
            $serviceList.html('<div class="col-12"><p class="text-center text-danger mt-5">Error al cargar los servicios.</p></div>');
        }
    }

    // --- RENDER FUNCTIONS ---
    function renderServices(servicesToRender) {
        // ... (this function remains the same)
        const $serviceList = $('#service-list');
        $serviceList.empty();
        if (servicesToRender.length === 0) {
            $serviceList.html('<div class="col-12"><p class="text-center text-muted mt-5">No se encontraron servicios.</p></div>');
            return;
        }
        servicesToRender.forEach(service => {
            const category = service.category || 'general';
            const serviceCard = `
                <div class="col-md-6 col-lg-4 mb-4 service-card" data-category="${category}" data-name="${service.name.toLowerCase()}">
                    <div class="card h-100">
                        <img src="${service.image}" class="card-img-top" alt="${service.name}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${service.name}</h5>
                            <p class="card-text flex-grow-1">${service.description}</p>
                            <p class="card-text fs-5 fw-bold text-primary">$${Number(service.price).toFixed(2)}</p>
                            <button class="btn btn-primary add-to-cart-btn mt-auto" data-id="${service.id}">Solicitar Servicio</button>
                        </div>
                    </div>
                </div>`;
            $serviceList.append(serviceCard);
        });
    }

    function updateCartBadge() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const $badge = $('#cart-badge');
        if (totalItems > 0) {
            $badge.text(totalItems).fadeIn();
        } else {
            $badge.fadeOut();
        }
    }

    // --- CART LOGIC (DATABASE) ---
    async function loadCartFromDB(user) {
        if (!user) {
            cart = [];
            updateCartBadge();
            return;
        }
        try {
            const { data, error } = await supabase
                .from('cart_items')
                .select('product_id, quantity, products (*)')
                .eq('user_id', user.id);

            if (error) throw error;
            
            // Map the data to the structure the app expects
            cart = data.map(item => ({
                ...item.products,
                quantity: item.quantity
            }));
            updateCartBadge();

        } catch (error) {
            console.error('Error loading cart:', error.message);
            cart = [];
            updateCartBadge();
        }
    }

    async function addToCart(serviceId) {
        if (!currentUser) {
            // If user is not logged in, show the login modal
            const loginModal = new bootstrap.Modal($('#login-modal'));
            loginModal.show();
            return;
        }

        try {
            // First, check if the item already exists
            const { data: existingItem, error: selectError } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('user_id', currentUser.id)
                .eq('product_id', serviceId)
                .single();

            if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = 'exact one row not found'
                throw selectError;
            }

            let newQuantity;
            if (existingItem) {
                // Item exists, update quantity
                newQuantity = existingItem.quantity + 1;
                const { error } = await supabase
                    .from('cart_items')
                    .update({ quantity: newQuantity })
                    .match({ id: existingItem.id });
                if (error) throw error;
            } else {
                // Item doesn't exist, insert it
                newQuantity = 1;
                const { error } = await supabase
                    .from('cart_items')
                    .insert({ user_id: currentUser.id, product_id: serviceId, quantity: 1 });
                if (error) throw error;
            }
            
            // Update local cart for immediate UI feedback
            const cartItem = cart.find(item => item.id === serviceId);
            if (cartItem) {
                cartItem.quantity = newQuantity;
            } else {
                const service = allServices.find(s => s.id === serviceId);
                cart.push({ ...service, quantity: 1 });
            }
            updateCartBadge();

        } catch (error) {
            console.error('Error adding to cart:', error.message);
        }
    }

    // --- THEME ---
    function applyTheme(theme) {
        // ... (this function remains the same)
        const icon = $('#theme-toggler').find('i');
        if (theme === 'dark') {
            $('html').addClass('dark-mode');
            icon.removeClass('fa-moon').addClass('fa-sun');
        } else {
            $('html').removeClass('dark-mode');
            icon.removeClass('fa-sun').addClass('fa-moon');
        }
    }

    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
    }

    // --- EVENT HANDLERS ---
    $('#service-list').on('click', '.add-to-cart-btn', async function () {
        const serviceId = $(this).data('id');
        const $btn = $(this);

        // Prevent multiple clicks
        $btn.prop('disabled', true);
        
        await addToCart(serviceId);

        // Animation & feedback
        const $card = $(this).closest('.card');
        $card.css('transition', 'transform 0.1s').css('transform', 'scale(0.98)');
        setTimeout(() => $card.css('transform', 'scale(1)'), 100);
        
        const originalText = "Solicitar Servicio";
        $btn.html('<i class="fas fa-check"></i> Añadido');
        setTimeout(() => {
            $btn.html(originalText).prop('disabled', false);
        }, 1500);
    });

    // ... (Filter and Search handlers remain the same)
    $('.filter-btn').on('click', function () {
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        const category = $(this).data('category');
        $('#search-bar').val('');
        const servicesToShow = category === 'all'
            ? allServices
            : allServices.filter(s => (s.category || 'general') === category);
        renderServices(servicesToShow);
    });

    $('#search-bar').on('keyup', function () {
        const searchTerm = $(this).val().toLowerCase();
        $('.filter-btn').removeClass('active');
        const filteredServices = allServices.filter(s => s.name.toLowerCase().includes(searchTerm));
        renderServices(filteredServices);
    });
    
    // ... (Theme and Contact Form handlers remain the same)
    $('#theme-toggler').on('click', function() {
        const newTheme = $('html').hasClass('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    $('#contact-form').on('submit', function (e) {
        e.preventDefault();
        if ($(this).get(0).checkValidity()) {
            $('#form-success-msg').slideDown(300).delay(4000).slideUp(300);
            $(this)[0].reset();
            $(this).removeClass('was-validated');
        } else {
            $(this).addClass('was-validated');
        }
    });
});

