import { Hono } from 'hono'
import * as z from 'zod'
import { zValidator } from '@hono/zod-validator';
import db from '../db/index.js';
// 1. Vehicle → VehicleID, PlateNumber, Model, Year, Color // 67022478	นายกรวิชญ์ อู่เงิน
const vehicleRoutes = new Hono();

type Vehicle = {
    VehicleID : number,
    plateNumber : string,
    Model : string,
    Year : string,
    Color : string
}
const CreateVehicleSchema = z.object({
    plateNumber : z.string().nonempty("Please input plate number"),
    model : z.string().nonempty("Please input model"),
    year : z.string().nonempty("Please input a valid year"),
    color : z.string().nonempty("Please input color")
})

//GET
vehicleRoutes.get('/getAll', async (c) => {
    let sql = 'SELECT * FROM Vehicles';
    let stmt = db.prepare<[], Vehicle>(sql);
    let vehicles : Vehicle[] = stmt.all();

    return c.json({ message : 'List of vehicles', data : vehicles})
})

//GET by ID
vehicleRoutes.get('get/:id', async (c) => {
    const { id } = c.req.param()
    let sql = 'SELECT * FROM Vehicles WHERE VehicleID = @id';
    let stmt = db.prepare<{id : string}, Vehicle>(sql);
    let vehicle = stmt.get({id : id});

    if (!vehicle) {
        return c.json({
            message : "Vehicle not founded"
        }, 404)
    }

    return c.json({ 
        message : `Vehicle for ID : ${id}`, 
        data : vehicle
    })
})

//POST
vehicleRoutes.post('/create', zValidator('json', CreateVehicleSchema, (result, c) => {
    if (!result.success){
        return c.json({
            message : "Validation Failed",
            errors : result.error.issues
        }, 400)
    }
}), async (c) => {
    const body = await c.req.json<Vehicle>();
    let sql = `INSERT INTO Vehicles
                (plateNumber, model, year, color)
                VALUES(@plateNumber, @model, @year, @color);`
    let stmt = db.prepare<Omit<Vehicle, 'VehicleID'>>(sql)
    let result = stmt.run(body);

    if (result.changes === 0) {
        return c.json({ message : "Failed to create vehicle"}, 500)
    }
    let lastRowid = result.lastInsertRowid as number

    let sql2 = 'SELECT * FROM Vehicles WHERE VehicleID = ?'
    let stmt2 = db.prepare<[number], Vehicle>(sql2)
    let newVehicle = stmt2.get(lastRowid)

    return c.json({ message : 'Vehicle created', data : newVehicle }, 201)
})

//UPDATE
vehicleRoutes.put('/edit/:id', zValidator('json', CreateVehicleSchema, (result, c) => {
    if (!result.success){
        return c.json({
            message : "Validation Failed",
            errors : result.error.issues
        }, 400)
    }
}), async (c) => {
    const body = await c.req.json<{ plateNumber: string, model: string, year: number, color: string }>()
    const id = Number(c.req.param('id'))
    let sql = `UPDATE Vehicles
            SET plateNumber=@plateNumber, model=@model, year=@year, color=@color
            WHERE VehicleID=@id;`
    let stmt = db.prepare(sql)
    let result = stmt.run({ ...body, id })

    if (result.changes === 0) {
        return c.json({ message : "Failed to update vehicle"}, 500)
    }

    const stmt2 = db.prepare('SELECT * FROM Vehicles WHERE VehicleID = ?')
    const newVehicle = stmt2.get(id)

    return c.json({ message : 'Vehicle updated', data : newVehicle }, 200)
})

//DELETE
vehicleRoutes.delete('/delete/:id', async (c) => {
    const id = Number(c.req.param('id'))
    let sql = `DELETE FROM Vehicles
            WHERE VehicleID=@id;`
    let stmt = db.prepare(sql)
    let result = stmt.run({ id });

    if (result.changes === 0) {
        return c.json({ message : "Failed to delete vehicle"}, 500)
    }

    return c.json({ message : `Vehicle ID : ${id}, deleted`}, 200)
})


export default vehicleRoutes;