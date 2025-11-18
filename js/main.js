$(document).ready(function () {

    // --- DATA ---
    const services = [
        {
            id: 1,
            name: 'Desarrollo Web Pro',
            description: 'Creación de sitios web a medida.',
            price: 1500,
            image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
            category: 'tecnologia'
        },
        {
            id: 2,
            name: 'Marketing Digital',
            description: 'Estrategias para impulsar tu marca.',
            price: 800,
            image: 'https://images.unsplash.com/photo-1508830524289-0adcbe822b40?auto=format&fit=crop&w=800&q=80',
            category: 'tecnologia'
        },
        {
            id: 3,
            name: 'Clases de Guitarra',
            description: 'Aprende a tocar desde cero.',
            price: 50,
            image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80',
            category: 'educacion'
        },
        {
            id: 4,
            name: 'Asesoría Financiera',
            description: 'Organiza tus finanzas personales.',
            price: 200,
            image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
            category: 'educacion'
        },
        {
            id: 5,
            name: 'Jardinería a Domicilio',
            description: 'Mantenimiento de jardines y patios.',
            price: 75,
            image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
            category: 'hogar'
        },
        {
            id: 6,
            name: 'Limpieza Profesional',
            description: 'Servicio de limpieza para casas.',
            price: 90,
            image: 'https://limpiezasbrillo.com/wp-content/uploads/2018/08/limpieza-a-fondo-del-hogar-1-1111x480.jpg',
            category: 'hogar'
        },
        {
            id: 7,
            name: 'Soporte Técnico IT',
            description: 'Solución a problemas informáticos.',
            price: 120,
            image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
            category: 'tecnologia'
        }
    ];


    let cart = [];

    // --- INITIALIZATION ---
    loadCart();
    renderServices(services);
    updateCartBadge();

    // --- RENDER FUNCTIONS ---
    function renderServices(servicesToRender) {
        const $serviceList = $('#service-list');
        // Clear the list before rendering to prevent duplication (fixes bug)
        $serviceList.empty();

        if (servicesToRender.length === 0) {
            $serviceList.html('<div class="col-12"><p class="text-center text-muted mt-5">No se encontraron servicios que coincidan con tu búsqueda.</p></div>');
            return;
        }

        servicesToRender.forEach(service => {
            const serviceCard = `
                <div class="col-md-6 col-lg-4 mb-4 service-card" data-category="${service.category}" data-name="${service.name.toLowerCase()}">
                    <div class="card h-100">
                        <img src="${service.image}" class="card-img-top" alt="${service.name}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${service.name}</h5>
                            <p class="card-text flex-grow-1">${service.description}</p>
                            <p class="card-text fs-5 fw-bold text-primary">$${service.price.toFixed(2)}</p>
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
        const service = services.find(s => s.id === serviceId);
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
    function loadTheme() {
        if (localStorage.getItem('theme') === 'dark') {
            $('body').addClass('dark-mode');
            $('#theme-toggler i').removeClass('fa-moon').addClass('fa-sun');
        } else {
            $('body').removeClass('dark-mode');
            $('#theme-toggler i').removeClass('fa-sun').addClass('fa-moon');
        }
    }

    // --- EVENT HANDLERS ---

    // Add to cart
    $('#service-list').on('click', '.add-to-cart-btn', function () {
        const serviceId = $(this).data('id');
        addToCart(serviceId);

        // Animation effect
        const $card = $(this).closest('.card');
        $card.css('transition', 'transform 0.1s').css('transform', 'scale(0.98)');
        setTimeout(() => $card.css('transform', 'scale(1)'), 100);

        // Show added confirmation
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

        $('#search-bar').val(''); // Reset search bar

        const servicesToShow = category === 'all'
            ? services
            : services.filter(s => s.category === category);

        renderServices(servicesToShow);
    });

    // Search bar
    $('#search-bar').on('keyup', function () {
        const searchTerm = $(this).val().toLowerCase();

        // Deactivate category filters when searching
        $('.filter-btn').removeClass('active');

        const filteredServices = services.filter(s => s.name.toLowerCase().includes(searchTerm));
        renderServices(filteredServices);
    });

        // Theme toggler

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

    // Contact Form Validation
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
