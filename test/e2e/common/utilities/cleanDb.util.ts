import { Connection } from 'mongoose';

export const cleanDb = async (dbConnection: Connection) => {
    await dbConnection.collection('hourregisters').deleteMany({});
    await dbConnection.collection('workpositions').deleteMany({});
    await dbConnection.collection('users').deleteMany({});
};
