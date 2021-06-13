import { buildSchema } from 'graphql';

// language=GraphQL
const graphQlSchema = buildSchema(`
    type User {
        id: ID!
        email: String!
        password: String
        isAdmin: Boolean
    }

    type Player {
        id: ID!
        name: String!
        handle: String!
        balance: Int
        gameCount: Int
        maxSeriesOfWin: Int
        maxSeriesOfLoose: Int
        isRegular: Boolean
        isShowInRating: Boolean
        results: [PlayerResult]
    }

    type Game {
        id: ID!
        name: String!
        isBigGame: Boolean
        buyIn: Int
        results: [Int]
        players: [Player]
        date: String
    }

    type PlayerResult {
        id: ID!
        game: Game!
        result: Int!
    }

    type AuthData {
        userId: ID!
        token: String!
        tokenExpiration: Int!
        isAdmin: Boolean
    }

    input UserInput {
        email: String!
        password: String!
    }

    input PlayerInput {
        _id: ID
        name: String!
        handle: String!
        isRegular: Boolean
        isShowInRating: Boolean
    }

    input GameInput {
        name: String
        date: String
        isBigGame: Boolean
        players: [ID!]
        buyIn: Int
    }

    input ResultInput {
        gameId: String!
        name: String
        date: String
        players: [ID!]
        results: [Int]
    }

    type RootQuery {
        # PLAYERS 
        getAllPlayers: [Player!]!
        getPlayer(_id: ID!): Player!
        getPlayerByHandle(handle: String): Player

        # GAMES
        getAllGames: [Game]
        getGame(_id: ID!): Game
        getGameCount: Int

        # AUTH        
        login(email: String!, password: String!): AuthData!
    }

    type RootMutation {
        createUser(userInput: UserInput): User
        createPlayer(playerInput: PlayerInput): Player!

        createGame(gameInput: GameInput): Game
        saveGameResult(resultInput: ResultInput): Game
        deleteGame(_id: ID): Game
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);

export default graphQlSchema;
