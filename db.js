import pg from 'pg';
import { uniquePatientIds } from './stripe.js';

const { Client } = pg;

const client = new Client({
  user: 'chat-prod',
  database: 'chat-prod',
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: 5432,
});

await client.connect();

let result = await client.query(`SELECT first_name, last_name, email, city, postal_code, street_name, house_number, unit_id FROM patients WHERE id = ANY($1)`, [uniquePatientIds]);
let patients = result.rows;

await client.end();

export default patients;