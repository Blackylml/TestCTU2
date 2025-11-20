/**
 * Seeds Runner
 * Script para poblar la base de datos con datos de prueba
 */

require('dotenv').config();
const { sequelize } = require('../../config/database');
const { User, Quiniela, Partido } = require('../../models');

const seedDatabase = async () => {
  try {
    console.log('🌱 Iniciando seeds...');

    // Sincronizar base de datos (recrear tablas)
    console.log('🔄 Sincronizando base de datos...');
    await sequelize.sync({ force: true });

    // Crear usuarios
    console.log('👤 Creando usuarios...');
    const admin = await User.create({
      nombre: 'Admin',
      email: 'admin@quinielapro.com',
      password: 'admin123',
      rol: 'admin',
      status: 'active',
    });

    const user1 = await User.create({
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'password123',
      rol: 'user',
      status: 'active',
    });

    const user2 = await User.create({
      nombre: 'María García',
      email: 'maria@example.com',
      password: 'password123',
      rol: 'user',
      status: 'active',
    });

    console.log('✅ Usuarios creados');

    // Crear quinielas
    console.log('🎯 Creando quinielas...');

    const quiniela1 = await Quiniela.create({
      nombre: 'Liga MX Jornada 17',
      descripcion: 'Quiniela de la jornada 17 del torneo Apertura 2024',
      deporte: 'futbol',
      precio: 50,
      premio_total: 5000,
      premio_primero: 3000,
      premio_segundo: 1500,
      premio_tercero: 500,
      max_participantes: 100,
      fecha_inicio: new Date('2024-12-01'),
      fecha_cierre: new Date('2024-12-15'),
      status: 'activa',
      creador_id: admin.id,
      publico: true,
    });

    const quiniela2 = await Quiniela.create({
      nombre: 'NFL Week 15',
      descripcion: 'Quiniela de la semana 15 de la NFL',
      deporte: 'futbol_americano',
      precio: 100,
      premio_total: 10000,
      premio_primero: 6000,
      premio_segundo: 3000,
      premio_tercero: 1000,
      max_participantes: 50,
      fecha_inicio: new Date('2024-12-10'),
      fecha_cierre: new Date('2024-12-18'),
      status: 'activa',
      creador_id: admin.id,
      publico: true,
    });

    console.log('✅ Quinielas creadas');

    // Crear partidos para quiniela 1
    console.log('⚽ Creando partidos...');

    await Partido.bulkCreate([
      {
        quiniela_id: quiniela1.id,
        equipo_local: 'América',
        equipo_visitante: 'Chivas',
        fecha_partido: new Date('2024-12-01T19:00:00'),
        liga: 'Liga MX',
        jornada: 'Jornada 17',
        orden: 0,
      },
      {
        quiniela_id: quiniela1.id,
        equipo_local: 'Cruz Azul',
        equipo_visitante: 'Pumas',
        fecha_partido: new Date('2024-12-01T21:00:00'),
        liga: 'Liga MX',
        jornada: 'Jornada 17',
        orden: 1,
      },
      {
        quiniela_id: quiniela1.id,
        equipo_local: 'Tigres',
        equipo_visitante: 'Monterrey',
        fecha_partido: new Date('2024-12-02T19:00:00'),
        liga: 'Liga MX',
        jornada: 'Jornada 17',
        orden: 2,
      },
      {
        quiniela_id: quiniela1.id,
        equipo_local: 'Santos',
        equipo_visitante: 'León',
        fecha_partido: new Date('2024-12-02T21:00:00'),
        liga: 'Liga MX',
        jornada: 'Jornada 17',
        orden: 3,
      },
    ]);

    // Crear partidos para quiniela 2
    await Partido.bulkCreate([
      {
        quiniela_id: quiniela2.id,
        equipo_local: 'Dallas Cowboys',
        equipo_visitante: 'Philadelphia Eagles',
        fecha_partido: new Date('2024-12-15T13:00:00'),
        liga: 'NFL',
        jornada: 'Week 15',
        orden: 0,
      },
      {
        quiniela_id: quiniela2.id,
        equipo_local: 'Kansas City Chiefs',
        equipo_visitante: 'Buffalo Bills',
        fecha_partido: new Date('2024-12-15T16:00:00'),
        liga: 'NFL',
        jornada: 'Week 15',
        orden: 1,
      },
      {
        quiniela_id: quiniela2.id,
        equipo_local: 'San Francisco 49ers',
        equipo_visitante: 'Seattle Seahawks',
        fecha_partido: new Date('2024-12-15T19:00:00'),
        liga: 'NFL',
        jornada: 'Week 15',
        orden: 2,
      },
    ]);

    console.log('✅ Partidos creados');

    console.log('');
    console.log('🎉 Seeds completados exitosamente!');
    console.log('');
    console.log('Usuarios creados:');
    console.log(`  Admin: admin@quinielapro.com / admin123`);
    console.log(`  User 1: juan@example.com / password123`);
    console.log(`  User 2: maria@example.com / password123`);
    console.log('');
    console.log('Quinielas creadas: 2');
    console.log('Partidos creados: 7');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seeds:', error);
    process.exit(1);
  }
};

seedDatabase();
