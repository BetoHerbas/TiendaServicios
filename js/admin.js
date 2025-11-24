import { supabase } from './supabase-client.js';

$(document).ready(function() {
    const loginSection = $('#login-section');
    const adminContent = $('#admin-content');
    const loginForm = $('#login-form');
    const loginError = $('#login-error');
    const logoutBtn = $('#logout-btn');
    const addProductForm = $('#add-product-form');
    const productSuccess = $('#product-success');
    const productError = $('#product-error');

    // --- COMMON FUNCTIONS ---
    // Function to apply theme instantly
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            $('html').addClass('dark-mode');
            $('#theme-toggler i').removeClass('fa-moon').addClass('fa-sun');
        } else {
            $('html').removeClass('dark-mode');
            $('#theme-toggler i').removeClass('fa-sun').addClass('fa-moon');
        }
    };

    // Function to update cart badge
    const updateCartBadge = () => {
        const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        const badge = $('#cart-badge');
        if (cart.length > 0) {
            badge.text(cart.length).show();
        } else {
            badge.hide();
        }
    };
    
    // Initialize theme and cart badge on page load
    const currentTheme = localStorage.getItem('theme') || 'light';
    applyTheme(currentTheme);
    updateCartBadge();

    // Theme toggler event
    $('#theme-toggler').on('click', function() {
        const html = $('html');
        html.toggleClass('dark-mode');
        const newTheme = html.hasClass('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });


    // --- AUTHENTICATION LOGIC ---

    const showLoginForm = () => {
        adminContent.hide();
        loginSection.show();
    };

    const showAdminContent = () => {
        loginSection.hide();
        adminContent.show();
    };

    const checkUserRole = async (user) => {
        if (!user) {
            showLoginForm();
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data && data.role === 'admin') {
                showAdminContent();
            } else {
                // Not an admin, sign them out and show login form
                await supabase.auth.signOut();
                showLoginForm();
            }
        } catch (error) {
            console.error('Error checking user role:', error.message);
            showLoginForm();
        }
    };

    // Check user status on page load
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            checkUserRole(session.user);
        } else if (event === 'SIGNED_OUT') {
            showLoginForm();
        }
    });
    
    // Initial check in case the user is already logged in
    (async () => {
        const { data: { session } } = await supabase.auth.getSession();
        checkUserRole(session?.user);
    })();


    // --- EVENT HANDLERS ---

    // Login form submission
    loginForm.on('submit', async function(e) {
        e.preventDefault();
        loginError.hide();
        const email = $('#login-email').val();
        const password = $('#login-password').val();

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            // Auth state change will handle showing the admin content
        } catch (error) {
            loginError.text(`Error: ${error.message}`).show();
        }
    });

    // Logout button
    logoutBtn.on('click', async function() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error.message);
        }
        // Auth state change will handle showing the login form
    });

    // Add product form submission
    addProductForm.on('submit', async function(e) {
        e.preventDefault();
        productSuccess.hide();
        productError.hide();

        const newProduct = {
            name: $('#product-name').val(),
            description: $('#product-description').val(),
            price: parseFloat($('#product-price').val()),
            image: $('#product-image').val(),
        };

        // Basic validation
        if (!newProduct.name || !newProduct.price) {
            productError.text('El nombre y el precio son obligatorios.').show();
            return;
        }

        try {
            const { error } = await supabase.from('products').insert([newProduct]);
            if (error) throw error;
            
            productSuccess.text('¡Producto añadido con éxito!').show();
            addProductForm[0].reset(); // Reset form fields
        } catch (error) {
            productError.text(`Error: ${error.message}`).show();
        }
    });
});
