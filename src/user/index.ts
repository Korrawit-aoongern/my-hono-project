import { Hono } from 'hono'
import * as z from 'zod'
import { zValidator } from '@hono/zod-validator';
import db from '../db/index.js';

const userroutes = new Hono();

type User = {
    id : number,
    username : string,
    password : string,
    firstname : string,
    lastname : string
}

const CreateUserSchema = z.object({
    username : z.string("Please input username").min(5, "Username must be at least 5 characters"),
    password : z.string("Please input password"),
    firstname : z.string("Please input first name").optional(),
    lastname : z.string("Please input last name").optional()
})

userroutes.get('/', async (c) => {
    let sql = 'SELECT * FROM users';
    let stmt = db.prepare<[], User>(sql);
    let users : User[] = stmt.all();

    return c.json({ message : 'List of users', data : users})
})

userroutes.get('/:id', async (c) => {
    const { id } = c.req.param()
    let sql = 'SELECT * FROM users WHERE id = @id';
    let stmt = db.prepare<{id : string}, User>(sql);
    let user = stmt.get({id : id});

    if (!user) {
        return c.json({
            message : "User not founded"
        }, 404)
    }

    return c.json({ 
        message : `User data for ID : ${id}`, 
        data : user
    })
})


userroutes.post('/', zValidator('json', CreateUserSchema, (result, c) => {
    if (!result.success){
        return c.json({
            message : "Validation Failed",
            errors : result.error.issues
        }, 400)
    }
}), async (c) => {
    const body = await c.req.json<User>();
    let sql = `INSERT INTO users
                (username, password, firstname, lastname)
                VALUES(@username, @password, @firstname, @lastname);`
    let stmt = db.prepare<Omit<User, 'id'>>(sql)
    let result = stmt.run(body);

    if (result.changes === 0) {
        return c.json({ message : "Failed to create user"}, 500)
    }
    let lastRowid = result.lastInsertRowid as number

    let sql2 = 'SELECT * FROM users WHERE id = ?'
    let stmt2 = db.prepare<[number], User>(sql2)
    let newUser = stmt2.get(lastRowid)

    return c.json({ message : 'User created', data : newUser }, 201)
})

export default userroutes;