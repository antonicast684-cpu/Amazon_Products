import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { internalError, ok } from "./lib/response";
import { QueryCommand} from "@aws-sdk/lib-dynamodb";
import { dynamo } from "./lib/dynamodb";
import { withCORS } from "./common/cors";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

async function listProductsBySellerHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const sellerId = event.pathParameters?.sellerId;

        if (!sellerId) {
            return ok({ products: [] })
        }

        const result = await dynamo.send(
            new QueryCommand({
                TableName: PRODUCTS_TABLE,
                IndexName: "SellerIndex",
                KeyConditionExpression: "sellerId = :sellerId",
                ExpressionAttributeValues: { ":sellerId": sellerId }
            })
        )
        
        return ok({ products: result.Items ?? [] })
    } catch (error) {
        console.error("Error al crear producto:", error);
        return internalError();
    }
}

export const listProductsBySeller = withCORS(listProductsBySellerHandler);