const { supabase } = require('../config/supabase');

const signUp = async (req, res) => {
    try {
        const { 
            email, 
            password,
            name,
            phone_number,
            id_number,
            date_of_birth,
            gender,
            country,
            employment_status,
            education_level,
            interests
        } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        // Create user metadata object
        const user_metadata = {
            name,
            phone_number,
            id_number,
            date_of_birth,
            gender,
            country,
            employment_status,
            education_level,
            interests: interests || []
        };

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: user_metadata
            }
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({
            message: 'User created successfully',
            user: data.user
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        res.json({
            message: 'Signed in successfully',
            session: data.session,
            user: data.user
        });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const signOut = async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Signed out successfully' });
    } catch (error) {
        console.error('Signout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    signUp,
    signIn,
    signOut,
    getCurrentUser
}; 