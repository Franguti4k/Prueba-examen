import type { UserModel, BookModel } from "./types.ts";
import { fromModelToBook, fromModelToUser } from "./utils.ts";
import { MongoClient, ObjectId} from 'mongodb';


const Mongo_URL = Deno.env.get("Mongo_URL");
if(!Mongo_URL){
  console.error("Error de conexion a la base de datos")
  Deno.exit(1);
}
const client = new MongoClient(Mongo_URL);
await client.connect();

const db = client.db("Nebrija");

const UsersCollection = db.collection<UserModel>("users");
const BooksCollection = db.collection<BookModel>("books");

const handler = async (req: Request): Promise<Response> => {
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;
  if(method === "GET"){
    if(path === "/users"){
      const name = url.searchParams.get("name")
      if(name){
        const usersDB = await UsersCollection.find({name}).toArray()
        const users = await Promise.all(usersDB.map((u: UserModel) => fromModelToUser(u, BooksCollection)) );
        return new Response(JSON.stringify(users));
      }else{
        const usersDB = await UsersCollection.find().toArray()
        const users = await Promise.all(usersDB.map((u: UserModel) => fromModelToUser(u, BooksCollection)));
        return new Response(JSON.stringify(users));
      }

    }
    if(path === "/user"){
      const email = url.searchParams.get("email")
      if(!email) return new Response("Bad request", {status: 400})
      const userDB = await UsersCollection.findOne({email})
    if(!userDB) return new Response("User not found", {status: 404})
      const user = await fromModelToUser(userDB, BooksCollection);
    return new Response(JSON.stringify(user))
    }
    if(path === "/books"){
      const booksBD = await BooksCollection.find().toArray()
      const books = await Promise.all(booksBD.map((b) => fromModelToBook(b)))
      return new Response(JSON.stringify(books))
    }
    if(path === "/book"){
      const id = url.searchParams.get("id")
      if(!id) return new Response("Bad Request", {status: 400})
      const bookDB = await BooksCollection.findOne({_id: new ObjectId(id)})
      if(!bookDB) return new Response("Nook not found", {status: 404})
      const book = await fromModelToBook(bookDB)
    return new Response(JSON.stringify(book))
    }
  }else if(method === "PHOST"){
    if(path === "/user"){
      const user = await req.json();
      if(!user.name || !user.age || !user.email){
        return new Response("Bad Request", {status: 400});
      }
      const userDB =  await UsersCollection.findOne({email : user.email})
      if(userDB) return new Response("User aready exists", {status: 409})

      const {insertedId} = await UsersCollection.insertOne({
        name: user.name,
        age: user.age,
        email: user.email,
        booksRead: [],
      })
      return new Response(
        JSON.stringify({
        name: user.name,
        age: user.age,
        email: user.email,
        booksread: [],
        id: insertedId
        })

      )
    }
    if(path === "/book"){
      const book = await req.json();
      if(!book.title || !book.pages ){
        return new Response("Bad Request", {status: 409});
      }
    }

  }else if(method === "PUT"){
    if(path === "/user"){
      const user = await req.json();
      if(!user.name || !user.email || !user.age || !user.books) return new Response("Bad request", {status: 400})
      const {modifiedCount} = await UsersCollection.updateOne(
    {email : user.email},
    {name: user.name, age: user.age}
    )

    if(modifiedCount === 0) return new Response("User not found", {status: 404})
    return new Response("OK", {status: 200})
    }
    if(path === "/book"){
      const book = await req.json();
      if(!book.id || !book.title || !book.pages) return new Response("Bad request", {status: 400})
      const {modifiedCount} = await BooksCollection.updateOne(
    {_id : book.id},
    {title: book.title, pages: book.pages}
    )

    if(modifiedCount === 0) return new Response("Book not found", {status: 404})
    return new Response("OK", {status: 200})
    }

  }else if(method === "DELETE"){
    if(path === "/user"){
      const id = url.searchParams.get("id")
      if(!id) return new Response("Bad request", {status: 400})
        const {deletedCount} = await UsersCollection.deleteOne({_id: new ObjectId(id)})
      if(deletedCount === 0) return new Response("User not found", {status: 404})
      return new Response("OK", {status: 200})
    }
    if(path === "/book"){
      const id = url.searchParams.get("id")
      if(!id) return new Response("Bad request", {status: 400})
      const {deletedCount} = await BooksCollection.deleteOne({_id : new ObjectId(id)})
      if(deletedCount === 0) return new Response("Book not found", {status: 404})
      await UsersCollection.updateMany({booksRead: new ObjectId(id)}, {$pull: {booksRead: new ObjectId(id)} })
        return new Response("OK", {status: 200})
    }
  }

  return new Response("end point not found", {status: 404});
  
}

Deno.serve({port: 3000}, handler);

