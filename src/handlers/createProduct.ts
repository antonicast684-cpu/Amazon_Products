import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { badRequest, internalError, create, forbidden } from "./lib/response";
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "./lib/dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Product } from "./types/product";
import { withCORS } from "./common/cors";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

 async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        //Conseguir el callerId y el role

        const callerId = event.requestContext.authorizer?.userId;
        const callerRole = event.requestContext.authorizer?.role;

        if (callerRole !== "seller") {
            return forbidden("Solo vendedores pueden crear productos.");
        }

        const body = JSON.parse(event.body ?? "{}");
        const { name, description, price, stock } = body;

        if (!name || !description || !price || !stock) {
            return badRequest("Se requieren todos los elementos para crear un producto.");
        }

        if (typeof price !== "number" || price < 0) {
            return badRequest("El precio tiene que ser un numero.");
        }

        if (typeof stock !== "number" || stock < 0 || !Number.isInteger(stock)) {
            return badRequest("El stock debe de ser un numero entero y mayor a 0.");
        }

        const now = new Date().toISOString();

        const product : Product = {
            productId: uuidv4(),
            sellerId: callerId,
            name,
            description,
            price,
            stock,
            createdAt: now,
            updatedAt: now
        }

        await dynamo.send(
            new PutCommand({ TableName: PRODUCTS_TABLE, Item: product })
        )

        return create({ product })
    } catch (error) {
        console.error("Error al crear producto:", error);
        return internalError();
    }
}

export const createProduct = withCORS(handler);