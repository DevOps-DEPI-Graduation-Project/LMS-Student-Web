
export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  old_password: string;
  new_password: string;
}

export interface LogoutRequest {
  refresh: string;
}

export interface LogoutResponse {
  refresh: string;
}

export interface Student {
  first_name:  string;   
  last_name:   string;   
  email:       string;   
  slug:        string;   
  is_verified: boolean;  
  image:       string | null; 
}

export interface StudentUpdateRequest {
  first_name: string;
  last_name:  string;
}
