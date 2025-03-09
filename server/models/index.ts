import { User } from './User';
import { FestDepartment } from './FestDepartment';
import { PaymentTransaction } from './PaymentTransaction';
import { FestPlacement } from './FestPlacement';
import { FestRoom } from './FestRoom';
import { Role } from './Role';
import { UserRole } from './UserRole';
import { FestDepartmentAdmin } from './FestDepartmentAdmin';


export interface Models {
  User: typeof User;
  FestDepartment: typeof FestDepartment;
  PaymentTransaction: typeof PaymentTransaction;
  FestPlacement: typeof FestPlacement;
  FestRoom: typeof FestRoom;
  Role: typeof Role;
  UserRole: typeof UserRole;
  FestDepartmentAdmin: typeof FestDepartmentAdmin;
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
  FestDepartmentAdmin
};


Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

export default models; 
