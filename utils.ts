import type { Collection } from "mongodb"
import type {UserModel, BookModel, User, Book} from "./types.ts"

export const fromModelToUser = async (userDB:UserModel, booksCollection:Collection<BookModel>): Promise<User> => {
    const books = await booksCollection.find({_id:{$in : userDB.booksRead}}).toArray();
    return{
        id: userDB._id!.toString(),
        name: userDB.name,
        age: userDB.age,
        email: userDB.email,
        booksRead: books.map((b) => fromModelToBook(b))
    }
}



export const fromModelToBook =  (bookDB: BookModel) : Book => {
    return{
        id: bookDB._id!.toString(),
        title: bookDB.title,
        pages: bookDB.pages
    }

}