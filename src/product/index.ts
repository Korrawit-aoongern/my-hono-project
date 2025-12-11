import { Hono } from 'hono'
import * as z from 'zod'
import { zValidator } from '@hono/zod-validator';

const productroutes = new Hono();

const productSchema = z.object({
    id: z.number().min(10000, "รหัสสินค้าต้องมีความยาว 5 ตัวอักษร"),
    name: z.string().min(5, "ชื่อสินค้าความยาวต้องไม่น้อยกว่า 5 ตัวอักษร"),
    price: z.float64(),
    cost: z.float64(),
    note: z.string().optional()
});

productroutes.post('/', zValidator('json', productSchema), async (c) => {
    const body = await c.req.json();
    return c.json({ message: 'Product created successfully', data: body });
});
export default productroutes;