import { Hono } from 'hono'
import * as z from 'zod'
import { zValidator } from '@hono/zod-validator';
import db from '../db/index.js';

const rolesroutes = new Hono();

type Role = {
    id : number,
    name : string
}

const CreateRolesSchema = z.object({
    name : z.string().nonempty("Please input role name"),
})

//GET
rolesroutes.get('/', async (c) => {
    let sql = 'SELECT * FROM Roles';
    let stmt = db.prepare<[], Role>(sql);
    let roles : Role[] = stmt.all();

    return c.json({ message : 'List of roles', data : roles})
})

//GET by ID
rolesroutes.get('/:id', async (c) => {
    const { id } = c.req.param()
    let sql = 'SELECT * FROM Roles WHERE id = @id';
    let stmt = db.prepare<{id : string}, Role>(sql);
    let role = stmt.get({id : id});

    if (!role) {
        return c.json({
            message : "Role not founded"
        }, 404)
    }

    return c.json({ 
        message : `Role name for ID : ${id}`, 
        data : role
    })
})

//POST
rolesroutes.post('/', zValidator('json', CreateRolesSchema, (result, c) => {
    if (!result.success){
        return c.json({
            message : "Validation Failed",
            errors : result.error.issues
        }, 400)
    }
}), async (c) => {
    const body = await c.req.json<Role>();
    let sql = `INSERT INTO Roles
                (name)
                VALUES(@name);`
    let stmt = db.prepare<Omit<Role, 'id'>>(sql)
    let result = stmt.run(body);

    if (result.changes === 0) {
        return c.json({ message : "Failed to create role"}, 500)
    }
    let lastRowid = result.lastInsertRowid as number

    let sql2 = 'SELECT * FROM Roles WHERE id = ?'
    let stmt2 = db.prepare<[number], Role>(sql2)
    let newRole = stmt2.get(lastRowid)

    return c.json({ message : 'Role created', data : newRole }, 201)
})

//UPDATE
rolesroutes.put('/:id', zValidator('json', CreateRolesSchema, (result, c) => {
    if (!result.success){
        return c.json({
            message : "Validation Failed",
            errors : result.error.issues
        }, 400)
    }
}), async (c) => {
    const body = await c.req.json<{ name: string }>()
    const id = Number(c.req.param('id'))
    let sql = `UPDATE Roles
            SET name=@name
            WHERE id=@id;`
    let stmt = db.prepare(sql)
    let result = stmt.run({ name: body.name, id })

    if (result.changes === 0) {
        return c.json({ message : "Failed to update role"}, 500)
    }

    const stmt2 = db.prepare('SELECT * FROM Roles WHERE id = ?')
    const newRole = stmt2.get(id)

    return c.json({ message : 'Role updated', data : newRole }, 200)
})

//DELETE
rolesroutes.delete('/:id', async (c) => {
    const id = Number(c.req.param('id'))
    let sql = `DELETE FROM Roles
            WHERE id=@id;`
    let stmt = db.prepare(sql)
    let result = stmt.run({ id });

    if (result.changes === 0) {
        return c.json({ message : "Failed to delete role"}, 500)
    }

    return c.json({ message : `Role ID : ${id}, deleted`}, 200)
})


export default rolesroutes;