// import mongoose from 'mongoose';
// import './envconfig.js';



// const Connect = async () => {
//     try {
//       await mongoose.connect(process.env.MONGODB_URI, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//         // useCreateIndex: true,
//       });
//       mongoose.Promise = global.Promise;
//     } catch (error) {
//       console.log(error.message)
//     }
//   }

// const connection = {};

// async function connect() {
//     if (connection.isConnected ) {
//         return
//     }
//     const db = await mongoose.connect(process.env.MONGODB_URL)

//     connection.isConnected = db.connections[0].readyState;
// };

export default Connect;