import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// ── Clients ────────────────────────────────────────────────────
const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const BUCKET = "your-bucket-name"; // ← your actual bucket
const REGION = "ap-south-1"; // ← your actual region
const s3 = new S3Client({ region: REGION });

const MENU_TABLE = "MenuItems";
const TBL_TABLE = "RestaurantTables";
const INV_TABLE = "Inventory";

// ── CORS ───────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...CORS },
    body: JSON.stringify(body),
  };
}

// ── Main Handler ───────────────────────────────────────────────
export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event));

  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = event.requestContext?.http?.path || event.path;

  if (method === "OPTIONS") return respond(200, { message: "ok" });

  try {
    // ════════════════════════════════════════
    // MENU ROUTES
    // ════════════════════════════════════════

    // GET /dishes
    if (method === "GET" && path === "/dishes") {
      const result = await db.send(new ScanCommand({ TableName: MENU_TABLE }));
      return respond(200, result.Items);
    }

    // POST /dishes
    if (method === "POST" && path === "/dishes") {
      const body = JSON.parse(event.body || "{}");
      if (!body.name || !body.price) {
        return respond(400, { error: "name and price are required" });
      }
      const newDish = {
        id: randomUUID(),
        name: body.name,
        description: body.description || "",
        category: body.category || "Uncategorized",
        price: Number(body.price),
        available: body.available ?? true,
        imageUrl: body.imageUrl || "",
        createdAt: new Date().toISOString(),
      };
      await db.send(new PutCommand({ TableName: MENU_TABLE, Item: newDish }));
      return respond(201, newDish);
    }

    // PUT /dishes/{id}
    if (method === "PUT" && path.startsWith("/dishes/")) {
      const id = path.split("/")[2];
      const body = JSON.parse(event.body || "{}");
      const fields = [
        "name",
        "description",
        "category",
        "price",
        "available",
        "imageUrl",
      ];
      const expParts = [];
      const expNames = {};
      const expValues = {};
      fields.forEach((f) => {
        if (body[f] !== undefined) {
          expParts.push(`#${f} = :${f}`);
          expNames[`#${f}`] = f;
          expValues[`:${f}`] = body[f];
        }
      });
      if (expParts.length === 0)
        return respond(400, { error: "No fields to update" });
      const result = await db.send(
        new UpdateCommand({
          TableName: MENU_TABLE,
          Key: { id },
          UpdateExpression: "SET " + expParts.join(", "),
          ExpressionAttributeNames: expNames,
          ExpressionAttributeValues: expValues,
          ReturnValues: "ALL_NEW",
        }),
      );
      return respond(200, result.Attributes);
    }

    // DELETE /dishes/{id}
    if (method === "DELETE" && path.startsWith("/dishes/")) {
      const id = path.split("/")[2];
      await db.send(new DeleteCommand({ TableName: MENU_TABLE, Key: { id } }));
      return respond(200, { message: "Dish deleted successfully" });
    }

    // POST /upload-url
    if (method === "POST" && path === "/upload-url") {
      const body = JSON.parse(event.body || "{}");
      const fileName = body.fileName || `dish-${randomUUID()}`;
      const contentType = body.contentType || "image/jpeg";
      const fileKey = `dishes/${randomUUID()}-${fileName}`;
      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: fileKey,
        ContentType: contentType,
      });
      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
      const imageUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${fileKey}`;
      return respond(200, { uploadUrl, imageUrl });
    }

    // ════════════════════════════════════════
    // TABLE ROUTES
    // ════════════════════════════════════════

    // GET /tables
    if (method === "GET" && path === "/tables") {
      const result = await db.send(new ScanCommand({ TableName: TBL_TABLE }));
      const sorted = result.Items.sort((a, b) => a.number - b.number);
      return respond(200, sorted);
    }

    // POST /tables
    if (method === "POST" && path === "/tables") {
      const body = JSON.parse(event.body || "{}");
      const newTable = {
        id: randomUUID(),
        number: body.number,
        name: body.name || `Table ${body.number}`,
        capacity: Number(body.capacity) || 4,
        status: "available",
        occupiedAt: null,
        createdAt: new Date().toISOString(),
      };
      await db.send(new PutCommand({ TableName: TBL_TABLE, Item: newTable }));
      return respond(201, newTable);
    }

    // PUT /tables/{id}
    if (method === "PUT" && path.startsWith("/tables/")) {
      const id = path.split("/")[2];
      const body = JSON.parse(event.body || "{}");
      const result = await db.send(
        new UpdateCommand({
          TableName: TBL_TABLE,
          Key: { id },
          UpdateExpression: "SET #status = :status, #occupiedAt = :occupiedAt",
          ExpressionAttributeNames: {
            "#status": "status",
            "#occupiedAt": "occupiedAt",
          },
          ExpressionAttributeValues: {
            ":status": body.status,
            ":occupiedAt":
              body.status === "occupied" ? new Date().toISOString() : null,
          },
          ReturnValues: "ALL_NEW",
        }),
      );
      return respond(200, result.Attributes);
    }

    // DELETE /tables/{id}
    if (method === "DELETE" && path.startsWith("/tables/")) {
      const id = path.split("/")[2];
      await db.send(new DeleteCommand({ TableName: TBL_TABLE, Key: { id } }));
      return respond(200, { message: "Table removed successfully" });
    }

    // ════════════════════════════════════════
    // INVENTORY ROUTES
    // ════════════════════════════════════════

    // GET /inventory
    if (method === "GET" && path === "/inventory") {
      const result = await db.send(new ScanCommand({ TableName: INV_TABLE }));
      return respond(200, result.Items);
    }

    // POST /inventory — create inventory item linked to a dish
    if (method === "POST" && path === "/inventory") {
      const body = JSON.parse(event.body || "{}");
      if (!body.dishId || !body.dishName) {
        return respond(400, { error: "dishId and dishName are required" });
      }
      const newItem = {
        id: randomUUID(),
        dishId: body.dishId,
        dishName: body.dishName,
        quantity: Number(body.quantity) || 0,
        unit: body.unit || "portions",
        lowStockAlert: Number(body.lowStockAlert) || 5,
        updatedAt: new Date().toISOString(),
      };
      await db.send(new PutCommand({ TableName: INV_TABLE, Item: newItem }));

      // Auto disable dish if quantity is 0
      if (newItem.quantity === 0) {
        await db.send(
          new UpdateCommand({
            TableName: MENU_TABLE,
            Key: { id: body.dishId },
            UpdateExpression: "SET #available = :available",
            ExpressionAttributeNames: { "#available": "available" },
            ExpressionAttributeValues: { ":available": false },
          }),
        );
      }

      return respond(201, newItem);
    }

    // PUT /inventory/{id} — update quantity or settings
    if (method === "PUT" && path.startsWith("/inventory/")) {
      const id = path.split("/")[2];
      const body = JSON.parse(event.body || "{}");

      // Fetch current inventory item to get dishId
      const current = await db.send(
        new GetCommand({
          TableName: INV_TABLE,
          Key: { id },
        }),
      );

      if (!current.Item) {
        return respond(404, { error: "Inventory item not found" });
      }

      const newQty = Number(body.quantity) ?? current.Item.quantity;
      const newAlert = Number(body.lowStockAlert) ?? current.Item.lowStockAlert;
      const newUnit = body.unit || current.Item.unit;

      // Update inventory
      const result = await db.send(
        new UpdateCommand({
          TableName: INV_TABLE,
          Key: { id },
          UpdateExpression:
            "SET #quantity = :quantity, #lowStockAlert = :lowStockAlert, #unit = :unit, #updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#quantity": "quantity",
            "#lowStockAlert": "lowStockAlert",
            "#unit": "unit",
            "#updatedAt": "updatedAt",
          },
          ExpressionAttributeValues: {
            ":quantity": newQty,
            ":lowStockAlert": newAlert,
            ":unit": newUnit,
            ":updatedAt": new Date().toISOString(),
          },
          ReturnValues: "ALL_NEW",
        }),
      );

      // Auto enable/disable dish based on quantity
      const dishAvailable = newQty > 0;
      await db.send(
        new UpdateCommand({
          TableName: MENU_TABLE,
          Key: { id: current.Item.dishId },
          UpdateExpression: "SET #available = :available",
          ExpressionAttributeNames: { "#available": "available" },
          ExpressionAttributeValues: { ":available": dishAvailable },
        }),
      );

      return respond(200, result.Attributes);
    }

    // DELETE /inventory/{id}
    if (method === "DELETE" && path.startsWith("/inventory/")) {
      const id = path.split("/")[2];
      await db.send(new DeleteCommand({ TableName: INV_TABLE, Key: { id } }));
      return respond(200, { message: "Inventory item removed" });
    }

    return respond(404, { error: "Route not found" });
  } catch (err) {
    console.error("Error:", err);
    return respond(500, {
      error: "Internal server error",
      detail: err.message,
    });
  }
};
