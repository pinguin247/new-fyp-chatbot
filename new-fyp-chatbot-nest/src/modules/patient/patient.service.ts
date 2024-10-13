import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class PatientService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async addNewPatient(doctorInputData: any) {
    try {
      // Insert into doctor_inputs table
      const { error: insertError } = await this.supabaseService
        .getClient()
        .from('doctor_inputs')
        .insert([doctorInputData]);

      if (insertError) {
        throw new Error(
          `Error inserting into doctor_inputs: ${insertError.message}`,
        );
      }

      // If successful, pass the doctorInputData to addPatientToDisplayTable
      await this.addPatientToDisplayTable(
        doctorInputData.patient_id,
        doctorInputData,
      );

      return { success: true, message: 'Patient added successfully' };
    } catch (error) {
      throw new Error(`Failed to add new patient: ${error.message}`);
    }
  }

  async addPatientToDisplayTable(
    patientId: string,
    doctorInputData: any,
  ): Promise<any> {
    try {
      // Fetch the patient profile from the profiles table using patient_id
      const { data: profileData, error: profileError } =
        await this.supabaseService
          .getClient()
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', patientId)
          .single();

      if (profileError) {
        throw new Error(`Error fetching profile data: ${profileError.message}`);
      }

      // Fetch the existing patient inputs from the patient_inputs table using patient_id
      const patientInputsData =
        await this.supabaseService.fetchUserInputsByPatientId(patientId);

      if (!patientInputsData) {
        console.error('No patient inputs data found.');
      }

      // Ensure that all required data exists
      if (profileData && patientInputsData && doctorInputData) {
        const newDisplayRecord = {
          patient_id: profileData.id,
          full_name: profileData.full_name,
          email: profileData.email,
          phone_number: patientInputsData.phone_number,
          age: patientInputsData.age,
          gender: patientInputsData.gender,
          medical_condition: doctorInputData.medical_condition, // Use doctorInputData directly
          disability_level: doctorInputData.disability_level, // Use doctorInputData directly
        };

        // Insert the new display record into the patient_display table
        const { error: insertError } = await this.supabaseService
          .getClient()
          .from('patient_display')
          .insert([newDisplayRecord]);

        if (insertError) {
          throw new Error(
            `Error inserting into patient_display: ${insertError.message}`,
          );
        }

        return {
          success: true,
          message: 'Patient added to display table successfully',
        };
      } else {
        return {
          success: false,
          message: 'Required data is missing from one or more tables',
        };
      }
    } catch (error) {
      console.log(error.message);
      throw new Error(
        `Failed to add patient to display table: ${error.message}`,
      );
    }
  }

  // New function to fetch doctor_inputs by patient_id
  async getDoctorInputsByPatientId(patientId: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('doctor_inputs')
        .select('*') // Select all columns, or specify the necessary columns
        .eq('patient_id', patientId)
        .single();

      if (error) {
        throw new Error(`Error fetching doctor inputs: ${error.message}`);
      }

      return data; // Return the fetched data directly
    } catch (error) {
      console.error('Error fetching doctor inputs:', error.message);
      throw error; // Rethrow the error to handle it properly
    }
  }
}
