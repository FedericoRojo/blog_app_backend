const {Client} = require("pg");
require('dotenv').config();



const SQL = `
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    fullname VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    status INTEGER CHECK (status IN (0, 1)) DEFAULT 0,  -- 0 for normalUser, 1 for adminUser
    hash TEXT NOT NULL,            -- Hash of the password
    salt TEXT NOT NULL             -- Salt used for hashing
);

CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    title VARCHAR(50) NOT NULL
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title_heading VARCHAR(255) NOT NULL,
    title_description TEXT,
    description TEXT,
    timestamp_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    img TEXT,
    tag INTEGER,  
    published BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (tag) REFERENCES tags(id)
);




CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    post_id INTEGER REFERENCES Posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Likes table to store likes on posts
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    post_id INTEGER,
    UNIQUE (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
`;

async function main(){
    console.log('seeding...');
    const client = new Client({
        connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
    });
    await client.connect();
    await client.query(SQL);
    await client.end();
    console.log('done');
}

main();