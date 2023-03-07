import express from "express";
import { prisma } from "../prisma/prisma-instance";
import { errorHandleMiddleware } from "./error-handler";
import "express-async-errors";

const app = express();
app.use(express.json());
// All code should go below this line

app.get("/", (req, res) => {
  res.status(200).send({ message: "Hello World!" });
});

app.get("/dogs", async (req, res) => {
  const dogs = await prisma.dog.findMany();
  res.status(200).send(dogs);
});

app.get("/dogs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    res
      .status(400)
      .send({ message: "id should be a number" });
  }
  const dog = await prisma.dog.findUnique({
    where: {
      id,
    },
  });

  if (!dog) {
    return res
      .send(204)
      .send({ error: true, message: "Dog not found" });
  }

  return res.status(200).send(dog);
});

app.post("/dogs", async (req, res) => {
  const errors = [];
  for (const key of Object.keys(req.body)) {
    if (!/age|name|description|breed/g.test(key)) {
      errors.push(`'${key}' is not a valid key`);
    }
  }

  const { age, name, description, breed } = req.body;
  const allRequiredKeys = [
    { key: "age", value: age, typeItShouldBe: "number" },
    { key: "name", value: name, typeItShouldBe: "string" },
    {
      key: "description",
      value: description,
      typeItShouldBe: "string",
    },
    {
      key: "breed",
      value: breed,
      typeItShouldBe: "string",
    },
  ];
  for (const key of allRequiredKeys) {
    if (
      !key.value &&
      typeof key.value !== key.typeItShouldBe
    ) {
      errors.push(
        `${key.key} should be a ${key.typeItShouldBe}`
      );
    }
  }
  if (errors.length > 0) {
    return res.status(400).send({ errors });
  }
  const newDogToAdd = await Promise.resolve()
    .then(() =>
      prisma.dog.create({
        data: {
          age,
          name,
          description,
          breed,
        },
      })
    )
    .catch(() => null);

  if (!newDogToAdd) {
    return res
      .status(400)
      .send({ age, name, description, breed });
  }

  return res
    .status(201)
    .send({ age, name, description, breed });
});

app.patch("/dogs/:id", async (req, res) => {
  const errors = [];
  for (const key of Object.keys(req.body)) {
    if (
      !/(^age$|^name$|^description$|^breed$)/g.test(key)
    ) {
      errors.push(`'${key}' is not a valid key`);
    }
  }
  if (errors.length > 0) {
    return res.send({ errors });
  }
  const id = Number(req.params.id);
  const updatedDog = await Promise.resolve()
    .then(() =>
      prisma.dog.update({
        where: {
          id,
        },
        data: {
          ...req.body,
        },
      })
    )
    .catch(() => null);

  if (!updatedDog) {
    return res
      .status(400)
      .send({ error: true, message: "Bad input" });
  }

  return res.status(201).send(req.body);
});

app.delete("/dogs/:id", async (req, res) => {
  const id = Number(req.params.id);
  const dog = await prisma.dog.findUnique({
    where: {
      id,
    },
  });
  const deleted = await Promise.resolve()
    .then(() =>
      prisma.dog.delete({
        where: {
          id,
        },
      })
    )
    .catch(() => null);
  if (!deleted) {
    return res
      .status(204)
      .send({ error: true, message: "Dog not found" });
  }
  res.status(200).send(dog);
});

// all your code should go above this line
app.use(errorHandleMiddleware);

const port = process.env.NODE_ENV === "test" ? 3001 : 3000;
app.listen(port, () =>
  console.log(`
🚀 Server ready at: http://localhost:${port}
`)
);
