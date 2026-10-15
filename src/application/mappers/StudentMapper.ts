import type { Student } from '@/src/domain/entities'
import type { GetStudentResponse } from '@/src/application/use-cases/queries/get-student/GetStudentResponse'

/**
 * Maps a Student domain entity to the read-model DTO returned by queries.
 * Pure function — no framework or DB knowledge.
 */
export class StudentMapper {
  public static toGetStudentResponse(student: Student): GetStudentResponse {
    const dob = student.getDateOfBirth()
    const current = student.getCurrentAddress()
    const permanent = student.getPermanentAddress()
    const guardian = student.getGuardian()
    const health = student.getHealthRecord()

    return {
      id: student.getId().getValue(),
      admissionNumber: student.getAdmissionNumber().getValue(),
      personalInfo: {
        firstNameDari: student.getFirstNameDari(),
        lastNameDari: student.getLastNameDari(),
        fullNameDari: student.getFullNameDari(),
        firstNamePashto: student.getFirstNamePashto(),
        lastNamePashto: student.getLastNamePashto(),
        fullNamePashto: student.getFullNamePashto(),
        firstNameEnglish: student.getFirstNameEnglish(),
        lastNameEnglish: student.getLastNameEnglish(),
        fullNameEnglish: student.getFullNameEnglish(),
        fatherName: student.getFatherName(),
        grandfatherName: student.getGrandfatherName(),
        motherName: student.getMotherName(),
        dateOfBirth: {
          solarHijri: dob.getSolarHijri(),
          gregorian: dob.getGregorian().toISOString(),
          age: dob.getAgeInYears(),
        },
        gender: student.getGender(),
        tazkiraNumber: student.getTazkiraNumber()?.getValue(),
        bloodGroup: student.getBloodGroup(),
        nationality: student.getNationality(),
        motherTongue: student.getMotherTongue(),
        sect: student.getSect(),
      },
      contactInfo: {
        studentMobile: student.getPhoneNumber()?.getValue(),
        fatherMobile: student.getFatherPhone().getValue(),
        motherMobile: student.getMotherPhone()?.getValue(),
        email: student.getEmail()?.getValue(),
        currentAddress: {
          province: current.getProvince(),
          district: current.getDistrict(),
          village: current.getVillage(),
          houseNumber: current.getHouseNumber(),
          landmark: current.getLandmark(),
          fullAddress: current.getFullAddress(),
        },
        permanentAddress: {
          province: permanent.getProvince(),
          district: permanent.getDistrict(),
          village: permanent.getVillage(),
          houseNumber: permanent.getHouseNumber(),
          landmark: permanent.getLandmark(),
          fullAddress: permanent.getFullAddress(),
        },
      },
      guardian: guardian
        ? {
            name: guardian.getName(),
            relation: guardian.getRelation(),
            occupation: guardian.getOccupation(),
            tazkiraNumber: guardian.getTazkiraNumber()?.getValue(),
            mobile: guardian.getPhoneNumber().getValue(),
          }
        : undefined,
      academicInfo: {
        gradeLevel: student.getGradeLevel().getGrade(),
        gradeDisplayName: student.getGradeLevel().getDisplayName('en'),
        section: student.getSection().getValue(),
        rollNumber: student.getRollNumber(),
        admissionDate: student.getAdmissionDate().toISOString(),
        status: student.getStatus(),
        previousSchool: student.getPreviousSchool(),
        previousGrade: student.getPreviousGrade(),
      },
      healthRecord: health
        ? {
            chronicIllness: health.getChronicIllness(),
            allergies: health.getAllergies(),
            medications: health.getMedications(),
            vaccinationStatus: health.getVaccinationStatus(),
            specialNeeds: health.getSpecialNeeds(),
            emergencyContactName: health.getEmergencyContactName(),
            emergencyContactNumber: health.getEmergencyContactNumber(),
          }
        : undefined,
      specialCategories: student.getSpecialCategories(),
      disabilityType: student.getDisabilityType(),
      feeWaiverPercentage: student.getFeeWaiverPercentage(),
      photoUrl: student.getPhotoUrl(),
      documents: student.getDocuments().map((d) => ({
        id: d.getId(),
        type: d.getType(),
        fileName: d.getFileName(),
        fileUrl: d.getFileUrl(),
        verified: d.isVerified(),
      })),
      createdAt: student.getCreatedAt().toISOString(),
      updatedAt: student.getUpdatedAt().toISOString(),
    }
  }
}
