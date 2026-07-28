const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const taskId = "cms4ylbnu00001scdtzbr4ggd"; // from user's request
  
  console.log("Checking Task:", taskId);
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  console.log("Task Mode:", task.mode);
  
  const runs = await prisma.workerRun.findMany({ where: { taskId }, orderBy: { createdAt: "asc" } });
  
  for (const run of runs) {
    console.log(`\n--- Worker: ${run.workerType} ---`);
    if (run.workerType === "SCRAPE") {
      console.log("Input:", run.input);
      console.log("Output Title:", run.output?.title);
      // Don't log full content if it's huge, but check if it existed
    } else if (run.workerType === "EXTRACT") {
      console.log("Input:", run.input);
      console.log("Output FactsCount:", run.output?.factsCount);
      console.log("Output Evidence:", JSON.stringify(run.output?.evidence, null, 2));
    } else if (run.workerType === "SEARCH") {
      console.log("Output:", JSON.stringify(run.output, null, 2).substring(0, 500));
    }
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
