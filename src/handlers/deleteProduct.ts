import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { internalError, ok, forbidden, notFound } from "./lib/response";
import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "./lib/dynamodb";
import { withCORS } from "./common/cors";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

async function deleteProductHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const productId = event.pathParameters?.id;

        if (!productId) {
            return notFound("El producto no existe.");
        }

        const callerId = event.requestContext.authorizer?.userId;

        const existing = await dynamo.send(
            new GetCommand({ TableName: PRODUCTS_TABLE, Key: { productId } })
        )

        if (!existing.Item) {
            return notFound("Producto no encontrado.");
        }

        if(existing.Item.sellerId !== callerId){
            return forbidden("Solo puedes borrar productos que tu hayas creado.");
        }

        await dynamo.send(
            new DeleteCommand({ TableName: PRODUCTS_TABLE, Key: { productId } })
        )

        return ok({ message: "Producto borrado exitosamente." })
    } catch (error) {
        console.error("Error al borrar el producto:", error);
        return internalError();
    }
}

export const deleteProduct = withCORS(deleteProductHandler);