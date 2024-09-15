import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class PatientService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async addPatientToDisplayTable(patientId: string): Promise<any> {
    try {
      // Fetch data from profiles table
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

      // Fetch data from patient_inputs table
      const { data: patientInputsData, error: patientInputsError } =
        await this.supabaseService
          .getClient()
          .from('patient_inputs')
          .select('phone_number, age, gender')
          .eq('patient_id', patientId)
          .single();

      if (patientInputsError) {
        throw new Error(
          `Error fetching patient inputs: ${patientInputsError.message}`,
        );
      }

      // Fetch data from doctor_inputs table
      const { data: doctorInputsData, error: doctorInputsError } =
        await this.supabaseService
          .getClient()
          .from('doctor_inputs')
          .select('medical_condition, disability_level')
          .eq('patient_id', patientId)
          .single();

      if (doctorInputsError) {
        throw new Error(
          `Error fetching doctor inputs: ${doctorInputsError.message}`,
        );
      }

      // Check if data exists in all three tables before creating a display record
      if (profileData && patientInputsData && doctorInputsData) {
        const newDisplayRecord = {
          patient_id: profileData.id,
          full_name: profileData.full_name,
          email: profileData.email,
          phone_number: patientInputsData.phone_number,
          age: patientInputsData.age,
          gender: patientInputsData.gender,
          medical_condition: doctorInputsData.medical_condition,
          disability_level: doctorInputsData.disability_level,
          created_at: new Date(),
          updated_at: new Date(),
        };

        // Insert the new record into the patient_display table
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
      console.log(data);

      return data; // Return the fetched data directly
    } catch (error) {
      console.error('Error fetching doctor inputs:', error.message);
      throw error; // Rethrow the error to handle it properly
    }
  }
}
