const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { User, Application, Contact } = require('./database/setup');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// JWT Authentication Middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please log in again.' });
        }
        return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }
}

// Admin Middleware
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    next();
}

// HEALTH & ROOT 

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Job Tracker API is running',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Job Application Tracker API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            register: 'POST /api/register',
            login: 'POST /api/login',
            applications: 'GET /api/applications (requires auth)',
            createApplication: 'POST /api/applications (requires auth)',
            updateApplication: 'PUT /api/applications/:id (requires auth)',
            deleteApplication: 'DELETE /api/applications/:id (requires auth)',
            contacts: 'GET /api/applications/:id/contacts (requires auth)',
            createContact: 'POST /api/applications/:id/contacts (requires auth)',
            adminApplications: 'GET /api/admin/applications (admin only)'
        }
    });
});

// AUTH ROUTES 

// POST /api/register
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'user'
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: newUser.id, username: newUser.username, email: newUser.email }
        });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });

    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// APPLICATION ROUTES 

// GET /api/applications
app.get('/api/applications', requireAuth, async (req, res) => {
    try {
        const applications = await Application.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            message: 'Applications retrieved successfully',
            applications,
            total: applications.length
        });

    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// GET /api/applications/:id
app.get('/api/applications/:id', requireAuth, async (req, res) => {
    try {
        const application = await Application.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.json(application);

    } catch (error) {
        console.error('Error fetching application:', error);
        res.status(500).json({ error: 'Failed to fetch application' });
    }
});

// POST /api/applications
app.post('/api/applications', requireAuth, async (req, res) => {
    try {
        const { companyName, jobTitle, status, dateApplied, jobPostingUrl, notes } = req.body;

        if (!companyName || !jobTitle || !dateApplied) {
            return res.status(400).json({ error: 'Company name, job title, and date applied are required' });
        }

        const newApplication = await Application.create({
            companyName,
            jobTitle,
            status: status || 'applied',
            dateApplied,
            jobPostingUrl,
            notes,
            userId: req.user.id
        });

        res.status(201).json({
            message: 'Application created successfully',
            application: newApplication
        });

    } catch (error) {
        console.error('Error creating application:', error);
        res.status(500).json({ error: 'Failed to create application' });
    }
});

// PUT /api/applications/:id
app.put('/api/applications/:id', requireAuth, async (req, res) => {
    try {
        const application = await Application.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const { companyName, jobTitle, status, dateApplied, jobPostingUrl, notes } = req.body;

        await application.update({
            companyName: companyName || application.companyName,
            jobTitle: jobTitle || application.jobTitle,
            status: status || application.status,
            dateApplied: dateApplied || application.dateApplied,
            jobPostingUrl: jobPostingUrl !== undefined ? jobPostingUrl : application.jobPostingUrl,
            notes: notes !== undefined ? notes : application.notes
        });

        res.json({ message: 'Application updated successfully', application });

    } catch (error) {
        console.error('Error updating application:', error);
        res.status(500).json({ error: 'Failed to update application' });
    }
});

// DELETE /api/applications/:id
app.delete('/api/applications/:id', requireAuth, async (req, res) => {
    try {
        const application = await Application.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        await application.destroy();
        res.json({ message: 'Application deleted successfully' });

    } catch (error) {
        console.error('Error deleting application:', error);
        res.status(500).json({ error: 'Failed to delete application' });
    }
});

// CONTACT ROUTES 

// GET /api/applications/:id/contacts
app.get('/api/applications/:id/contacts', requireAuth, async (req, res) => {
    try {
        const application = await Application.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const contacts = await Contact.findAll({
            where: { applicationId: req.params.id }
        });

        res.json({ message: 'Contacts retrieved successfully', contacts, total: contacts.length });

    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

// POST /api/applications/:id/contacts
app.post('/api/applications/:id/contacts', requireAuth, async (req, res) => {
    try {
        const application = await Application.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const { name, email, phone, company } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Contact name is required' });
        }

        const newContact = await Contact.create({
            name,
            email,
            phone,
            company,
            applicationId: req.params.id
        });

        res.status(201).json({ message: 'Contact created successfully', contact: newContact });

    } catch (error) {
        console.error('Error creating contact:', error);
        res.status(500).json({ error: 'Failed to create contact' });
    }
});

// PUT /api/applications/:id/contacts/:contactId
app.put('/api/applications/:id/contacts/:contactId', requireAuth, async (req, res) => {
    try {
        const application = await Application.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const contact = await Contact.findOne({
            where: { id: req.params.contactId, applicationId: req.params.id }
        });

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        const { name, email, phone, company } = req.body;

        await contact.update({
            name: name || contact.name,
            email: email !== undefined ? email : contact.email,
            phone: phone !== undefined ? phone : contact.phone,
            company: company !== undefined ? company : contact.company
        });

        res.json({ message: 'Contact updated successfully', contact });

    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ error: 'Failed to update contact' });
    }
});

// DELETE /api/applications/:id/contacts/:contactId
app.delete('/api/applications/:id/contacts/:contactId', requireAuth, async (req, res) => {
    try {
        const application = await Application.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const contact = await Contact.findOne({
            where: { id: req.params.contactId, applicationId: req.params.id }
        });

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        await contact.destroy();
        res.json({ message: 'Contact deleted successfully' });

    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ error: 'Failed to delete contact' });
    }
});

// ADMIN ROUTES 

// GET /api/admin/applications
app.get('/api/admin/applications', requireAuth, requireAdmin, async (req, res) => {
    try {
        const applications = await Application.findAll({
            include: [{ model: User, attributes: ['id', 'username', 'email'] }],
            order: [['createdAt', 'DESC']]
        });

        res.json({ message: 'All applications retrieved successfully', applications, total: applications.length });

    } catch (error) {
        console.error('Error fetching all applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// ERROR HANDLING

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
    res.status(404).json({ error: `${req.method} ${req.path} is not a valid endpoint` });
});

// START SERVER

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
    });
}

module.exports = app;