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
import { FestRegistration } from './FestRegistration';
import { FestRegistrationChild } from './FestRegistrationChild';
import { FestRegistrationDepartment } from './FestRegistrationDepartment';


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
  FestRegistration: typeof FestRegistration;
  FestRegistrationChild: typeof FestRegistrationChild;
  FestRegistrationDepartment: typeof FestRegistrationDepartment;
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
  FestFestivalDepartment,
  FestRegistration,
  FestRegistrationChild,
  FestRegistrationDepartment
};


Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

export default models; 
