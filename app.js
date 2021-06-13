import express from 'express';
import cors from 'cors';
import { graphqlHTTP } from 'express-graphql';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import graphQlSchema from './src/schema/index.js';
import rootResolver from './src/resolvers/index.js';
import connectDB from './src/config/db.js';
import isAuth from './src/middleware/isAuth.js';

dotenv.config();
connectDB();
const PORT = process.env.PORT || 5001;
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(isAuth);

app.use(
  '/graphql',
  graphqlHTTP({
    graphiql: true,
    schema: graphQlSchema,
    rootValue: rootResolver,
  }),
);

app.listen(PORT, (err) =>
  err ? console.log(`Error: ${err}`) : console.log(`Server started on port ${PORT}`),
);
