import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize'
import config from './config'

const db = new Sequelize(config.dbSchema, config.dbUser, config.dbPassword, {
	host: config.dbHost,
	port: Number(config.dbPort),
	dialect: 'postgres',
	dialectOptions: {
		ssl: process.env.DB_SSL == 'true'
	},
	pool: {
		max: config.pool.max,
		min: config.pool.min,
		acquire: config.pool.acquire,
		idle: config.pool.idle
	}
})

interface Thread extends Model<InferAttributes<Thread>, InferCreationAttributes<Thread>> {
	medium: string
	identifier: string
	openai_thread_id: string
}

export const Thread = db.define<Thread>('thread', {
	medium: {
		type: DataTypes.STRING,
		allowNull: false
	},
	identifier: {
		type: DataTypes.STRING,
		allowNull: false
	},
	openai_thread_id: {
		type: DataTypes.STRING,
		allowNull: false
	}
})

export default db
