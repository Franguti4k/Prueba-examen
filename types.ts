import {ObjectId, type OptionalId} from "mongodb";

export type UserModel = OptionalId <{
    name: string;
    age: number;
    email: string;
    booksRead: ObjectId[];
}>;

export type BookModel = OptionalId <{
    title: string;
    pages: number;
}>;

export type User = {
    id: string;
    name: string;
    age: number;
    email: string;
    booksRead: Book[];
}

export type Book = {
    id: string;
    title: string;
    pages: number;
}