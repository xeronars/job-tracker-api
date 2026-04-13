const bcrypt = require('bcryptjs');
const { sequelize, User, Application, Contact } = require('./setup');

async function seedDatabase() {
    try {
        // Wait for tables to be created first
        await sequelize.sync({ force: true });
        console.log('Tables created successfully.');
        
        // Create users
        const hashedPassword = await bcrypt.hash('password123', 10);

        const user1 = await User.create({
            username: 'johndoe',
            email: 'john@example.com',
            password: hashedPassword,
            role: 'user'
        });

        const admin = await User.create({
            username: 'admin',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin'
        });

        // Create applications for user1
        const app1 = await Application.create({
            companyName: 'Google',
            jobTitle: 'Software Engineer',
            status: 'interview',
            dateApplied: '2026-03-15',
            jobPostingUrl: 'https://careers.google.com',
            notes: 'Referral from a friend',
            userId: user1.id
        });

        const app2 = await Application.create({
            companyName: 'Meta',
            jobTitle: 'Backend Developer',
            status: 'applied',
            dateApplied: '2026-03-20',
            jobPostingUrl: 'https://careers.meta.com',
            notes: 'Applied through LinkedIn',
            userId: user1.id
        });

        // Create contacts
        await Contact.create({
            name: 'Sarah Johnson',
            email: 'sarah@google.com',
            phone: '555-1234',
            company: 'Google',
            applicationId: app1.id
        });

        await Contact.create({
            name: 'Mike Smith',
            email: 'mike@meta.com',
            phone: '555-5678',
            company: 'Meta',
            applicationId: app2.id
        });

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();