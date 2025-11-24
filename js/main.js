import { supabase } from './supabase-client.js';

$(document).ready(function () {

    // --- GLOBAL STATE ---
    let allServices = []; // This will hold the services fetched from Supabase
    let cart = [];

    // --- INITIALIZATION ---
    async function initializePage() {
        loadCart();
        updateCartBadge();
        await fetchAndRenderServices();
        // Theme setup is now more robust
        initializeTheme();
    }

    initializePage();

    // --- DATA FETCHING ---
    async function fetchAndRenderServices() {
        const $serviceList = $('#service-list');
        try {
            $serviceList.html('<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>');

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;

            allServices = data; // Store fetched data globally
            renderServices(allServices);

        } catch (error) {
            console.error('Error fetching services:', error.message);
            $serviceList.html('<div class="col-12"><p class="text-center text-danger mt-5">Error al cargar los servicios. Por favor, intente de nuevo más tarde.</p></div>');
        }
    }

    // --- RENDER FUNCTIONS ---
    function renderServices(servicesToRender) {
        const $serviceList = $('#service-list');
        $serviceList.empty();

        if (servicesToRender.length === 0) {
            $serviceList.html('<div class="col-12"><p class="text-center text-muted mt-5">No se encontraron servicios que coincidan con tu búsqueda.</p></div>');
            return;
        }

        servicesToRender.forEach(service => {
            // The 'category' field might not exist in the new DB structure.
            // We'll add a placeholder or handle it gracefully.
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
                </div>
            `;
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

    // --- CART LOGIC ---
    function addToCart(serviceId) {
        // Find the service in the globally stored `allServices` array
        const service = allServices.find(s => s.id === serviceId);
        if (!service) {
            console.error("Service not found!");
            return;
        }
        const cartItem = cart.find(item => item.id === serviceId);

        if (cartItem) {
            cartItem.quantity++;
        } else {
            cart.push({ ...service, quantity: 1 });
        }
        saveCart();
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

    // --- THEME ---
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

    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
    }

    // --- EVENT HANDLERS ---

    // Add to cart
    $('#service-list').on('click', '.add-to-cart-btn', function () {
        const serviceId = $(this).data('id');
        addToCart(serviceId);

        const $card = $(this).closest('.card');
        $card.css('transition', 'transform 0.1s').css('transform', 'scale(0.98)');
        setTimeout(() => $card.css('transform', 'scale(1)'), 100);

        const $btn = $(this);
        const originalText = $btn.html();
        $btn.html('<i class="fas fa-check"></i> Añadido').prop('disabled', true);
        setTimeout(() => {
            $btn.html(originalText).prop('disabled', false);
        }, 1500);
    });

    // Filters
    $('.filter-btn').on('click', function () {
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        const category = $(this).data('category');

        $('#search-bar').val('');

        // Filter from the `allServices` array
        const servicesToShow = category === 'all'
            ? allServices
            : allServices.filter(s => (s.category || 'general') === category);

        renderServices(servicesToShow);
    });

    // Search bar
    $('#search-bar').on('keyup', function () {
        const searchTerm = $(this).val().toLowerCase();
        $('.filter-btn').removeClass('active');

        // Search from the `allServices` array
        const filteredServices = allServices.filter(s => s.name.toLowerCase().includes(searchTerm));
        renderServices(filteredServices);
    });

    // Theme toggler
    $('#theme-toggler').on('click', function() {
        const newTheme = $('html').hasClass('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // Contact Form Validation (no changes needed here)
    $('#contact-form').on('submit', function (e) {
        e.preventDefault();
        let isValid = true;
        $('.form-control').removeClass('is-invalid is-valid');
        $('.invalid-feedback').hide();
        const $name = $('#nombre');
        if ($name.val().trim() === '') {
            $name.addClass('is-invalid');
            isValid = false;
        } else {
            $name.addClass('is-valid');
        }
        const $email = $('#email');
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test($email.val())) {
            $email.addClass('is-invalid');
            isValid = false;
        } else {
            $email.addClass('is-valid');
        }
        const $message = $('#mensaje');
        if ($message.val().trim() === '') {
            $message.addClass('is-invalid');
            isValid = false;
        } else {
            $message.addClass('is-valid');
        }
        if (isValid) {
            $('#form-success-msg').slideDown(300).delay(4000).slideUp(300);
            $(this)[0].reset();
            $('.form-control').removeClass('is-valid');
        }
    });

    $('#contact-form .form-control').on('input', function () {
        if ($(this).val().trim() !== '') {
            $(this).removeClass('is-invalid');
        }
    });
});

