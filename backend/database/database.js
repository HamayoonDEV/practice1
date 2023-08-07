import mongoose from "mongoose";
import { CONNECT_DATABASE } from "../config/index.js";

const connectDb = async () => {
  try {
    const con = await mongoose.connect(CONNECT_DATABASE);
    console.log(`Database is connected to the Host: ${con.connection.host}`);
  } catch (error) {
    console.log(error);
  }
};

export default connectDb;
