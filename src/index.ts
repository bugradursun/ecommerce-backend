import express, { Express, Request, Response } from "express";
import { PORT } from "./secrets";
import rootRouter from "./routes";
import { PrismaClient } from "@prisma/client";
import { errorMiddleware } from "./middlewares/errors";
import { SignUpSchema } from "./schema/users";

const app: Express = express();

app.use(express.json());

app.use("/api", rootRouter);

export const prismaClient = new PrismaClient({
  log: ["query"], //can also define transaction options as second parameter
}).$extends({
  //extends is used to add custom methods to the PrismaClient instance
  /**
   * extends works as this:
   * 1. Ornegin address normalde a,b,c,d return ediyor query sonucunda
   * 2. Biz bunu formattedAddress olarak donusturuyoruz ve bu donusturme islemini burada tanimliyoruz
   * 3. address.formattedAddress şeklinde call ederek compute methodundaki biçimde donusturulmus adresi alabiliriz
   */
  result: {
    address: {
      formattedAddress: {
        needs: {
          lineOne: true,
          lineTwo: true,
          city: true,
          country: true,
          pincode: true,
        },
        compute: (address) => {
          return `${address.lineOne}, ${address.lineTwo}, ${address.city}, ${address.country}-${address.pincode}`;
        },
      },
    },
  },
});

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log("App is working!");
});
