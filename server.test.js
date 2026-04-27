require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { sequelize, User, Application, Contact } = require('./database/setup');

const app = require('./server');

beforeAll(async () => {
    await sequelize.sync({ force: true });

    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
        username: 'testuser',
        email: 'testuser@example.com',
        password: hashedPassword,
        role: 'user'
    });

    await User.create({
        username: 'testadmin',
        email: 'testadmin@example.com',
        password: hashedPassword,
        role: 'admin'
    });
});

afterAll(async () => {
    await sequelize.close();
});

// ─── AUTH TESTS ───────────────────────────────────────────────

describe('POST /api/register', () => {
    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({
                username: 'newuser',
                email: 'newuser@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'User registered successfully');
    });

    it('should fail if email already exists', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('should fail if required fields are missing', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({ email: 'missing@example.com' });
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
    });
});

describe('POST /api/login', () => {
    it('should login successfully and return a token', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({
                email: 'testuser@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should fail with wrong password', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({
                email: 'testuser@example.com',
                password: 'wrongpassword'
            });
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error');
    });

    it('should fail with non-existent email', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({
                email: 'nobody@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error');
    });
});

// ─── APPLICATION TESTS ────────────────────────────────────────

describe('Application Endpoints', () => {
    let userToken;
    let adminToken;
    let applicationId;

    beforeAll(async () => {
        const userRes = await request(app)
            .post('/api/login')
            .send({ email: 'testuser@example.com', password: 'password123' });
        userToken = userRes.body.token;

        const adminRes = await request(app)
            .post('/api/login')
            .send({ email: 'testadmin@example.com', password: 'password123' });
        adminToken = adminRes.body.token;
    });

    it('should create a new application', async () => {
        const res = await request(app)
            .post('/api/applications')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                companyName: 'Netflix',
                jobTitle: 'Backend Engineer',
                status: 'applied',
                dateApplied: '2026-04-13'
            });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'Application created successfully');
        applicationId = res.body.application.id;
    });

    it('should get all applications for the user', async () => {
        const res = await request(app)
            .get('/api/applications')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('applications');
    });

    it('should update an application', async () => {
        const res = await request(app)
            .put(`/api/applications/${applicationId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ status: 'interview' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Application updated successfully');
    });

    it('should fail to get applications without token', async () => {
        const res = await request(app).get('/api/applications');
        expect(res.statusCode).toBe(401);
    });

    it('should allow admin to view all applications', async () => {
        const res = await request(app)
            .get('/api/admin/applications')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('applications');
    });

    it('should deny regular user access to admin endpoint', async () => {
        const res = await request(app)
            .get('/api/admin/applications')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toBe(403);
    });

    it('should delete an application', async () => {
        const res = await request(app)
            .delete(`/api/applications/${applicationId}`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Application deleted successfully');
    });
});

// ─── CONTACT TESTS ────────────────────────────────────────────

describe('Contact Endpoints', () => {
    let userToken;
    let applicationId;
    let contactId;

    beforeAll(async () => {
        const userRes = await request(app)
            .post('/api/login')
            .send({ email: 'testuser@example.com', password: 'password123' });
        userToken = userRes.body.token;

        const appRes = await request(app)
            .post('/api/applications')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                companyName: 'Spotify',
                jobTitle: 'API Developer',
                status: 'applied',
                dateApplied: '2026-04-13'
            });
        applicationId = appRes.body.application.id;
    });

    it('should create a contact for an application', async () => {
        const res = await request(app)
            .post(`/api/applications/${applicationId}/contacts`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: 'Jane Recruiter',
                email: 'jane@spotify.com',
                phone: '555-9999',
                company: 'Spotify'
            });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'Contact created successfully');
        contactId = res.body.contact.id;
    });

    it('should get all contacts for an application', async () => {
        const res = await request(app)
            .get(`/api/applications/${applicationId}/contacts`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('contacts');
    });

    it('should update a contact', async () => {
        const res = await request(app)
            .put(`/api/applications/${applicationId}/contacts/${contactId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ phone: '555-0000' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Contact updated successfully');
    });

    it('should delete a contact', async () => {
        const res = await request(app)
            .delete(`/api/applications/${applicationId}/contacts/${contactId}`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Contact deleted successfully');
    });
});