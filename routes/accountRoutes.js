import express from 'express';
const accountRoutes = express.Router();



accountRoutes.get('/', (req, res) => res.send('This is the Account Page!') )

export default accountRoutes;