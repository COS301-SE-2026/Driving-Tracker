import request from 'supertest';
import bcrypt from 'bcrypt';
import { describe, expect, it, afterAll } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';



