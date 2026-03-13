import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.bankEntry.deleteMany();
  await prisma.shipCompliance.deleteMany();
  await prisma.route.deleteMany();

  // Seed routes
  const routes = [
    { routeId: 'R001', vesselType: 'Container', fuelType: 'HFO', year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000, totalEmissions: 4500, isBaseline: true },
    { routeId: 'R002', vesselType: 'BulkCarrier', fuelType: 'LNG', year: 2024, ghgIntensity: 88.0, fuelConsumption: 4800, distance: 11500, totalEmissions: 4200, isBaseline: false },
    { routeId: 'R003', vesselType: 'Tanker', fuelType: 'MGO', year: 2024, ghgIntensity: 93.5, fuelConsumption: 5100, distance: 12500, totalEmissions: 4700, isBaseline: false },
    { routeId: 'R004', vesselType: 'RoRo', fuelType: 'HFO', year: 2025, ghgIntensity: 89.2, fuelConsumption: 4900, distance: 11800, totalEmissions: 4300, isBaseline: false },
    { routeId: 'R005', vesselType: 'Container', fuelType: 'LNG', year: 2025, ghgIntensity: 90.5, fuelConsumption: 4950, distance: 11900, totalEmissions: 4400, isBaseline: false },
    { routeId: 'R006', vesselType: 'Tanker', fuelType: 'VLSFO', year: 2024, ghgIntensity: 92.1, fuelConsumption: 5200, distance: 13000, totalEmissions: 4800, isBaseline: false },
    { routeId: 'R007', vesselType: 'BulkCarrier', fuelType: 'Methanol', year: 2025, ghgIntensity: 85.2, fuelConsumption: 4600, distance: 11200, totalEmissions: 3900, isBaseline: false },
    { routeId: 'R008', vesselType: 'Container', fuelType: 'LNG', year: 2025, ghgIntensity: 87.5, fuelConsumption: 4700, distance: 11400, totalEmissions: 4100, isBaseline: false },
    { routeId: 'R009', vesselType: 'RoRo', fuelType: 'MGO', year: 2024, ghgIntensity: 94.0, fuelConsumption: 5300, distance: 12800, totalEmissions: 4900, isBaseline: false },
    { routeId: 'R010', vesselType: 'Tanker', fuelType: 'Biodiesel', year: 2025, ghgIntensity: 76.3, fuelConsumption: 4400, distance: 10800, totalEmissions: 3400, isBaseline: false },
  ];

  for (const route of routes) {
    await prisma.route.create({ data: route });
  }

  // Seed ship compliance records
  const TARGET_INTENSITY = 89.3368;
  const MJ_PER_TON = 41000;

  const ships = [
    { shipId: 'S001', routeId: 'R001' },
    { shipId: 'S002', routeId: 'R002' },
    { shipId: 'S003', routeId: 'R003' },
    { shipId: 'S004', routeId: 'R004' },
    { shipId: 'S005', routeId: 'R005' },
    { shipId: 'S006', routeId: 'R006' },
    { shipId: 'S007', routeId: 'R007' },
    { shipId: 'S008', routeId: 'R008' },
    { shipId: 'S009', routeId: 'R009' },
    { shipId: 'S010', routeId: 'R010' },
  ];

  for (const ship of ships) {
    const route = routes.find(r => r.routeId === ship.routeId)!;
    const energy = route.fuelConsumption * MJ_PER_TON;
    const cb = (TARGET_INTENSITY - route.ghgIntensity) * energy;

    await prisma.shipCompliance.create({
      data: {
        shipId: ship.shipId,
        year: route.year,
        cbGco2eq: cb,
      },
    });
  }

  console.log('Database seeded successfully!');
  console.log(`Seeded ${routes.length} routes and ${ships.length} compliance records`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
