import { User } from './User';
import { FestDepartment } from './FestDepartment';
import { PaymentTransaction } from './PaymentTransaction';
import { FestPlacement } from './FestPlacement';
import { FestRoom } from './FestRoom';
import { Role } from './Role';
import { UserRole } from './UserRole';
import { FestDepartmentAdmin } from './FestDepartmentAdmin';
import { Festival } from './Festival';
import { FestFestivalDepartment } from './FestFestivalDepartment';


export interface Models {
  User: typeof User;
  FestDepartment: typeof FestDepartment;
  PaymentTransaction: typeof PaymentTransaction;
  FestPlacement: typeof FestPlacement;
  FestRoom: typeof FestRoom;
  Role: typeof Role;
  UserRole: typeof UserRole;
  FestDepartmentAdmin: typeof FestDepartmentAdmin;
  Festival: typeof Festival;
  FestFestivalDepartment: typeof FestFestivalDepartment;
  [key: string]: any;
}


const models: Models = {
  User,
  FestDepartment,
  PaymentTransaction,
  FestPlacement,
  FestRoom,
  Role,
  UserRole,
  FestDepartmentAdmin,
  Festival,
  FestFestivalDepartment
};


Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

export default models; 
