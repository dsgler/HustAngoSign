import { otherIds } from './otherIds';

export interface CourseJson {
  [key: string]: number;
}

interface ArrayItem {
  userStatus: number;
  nameTwo: string;
  otherId: keyof typeof otherIds;
  groupId: number;
  source: number;
  isLook: number;
  type: number;
  releaseNum: number;
  classId: number;
  attendNum: number;
  activeType: number;
  logo: string;
  nameOne: string;
  startTime: number;
  id: number;
  endTime: number;
  status: number;
  nameFour: string;
}

export interface Data {
  courseJson: CourseJson;
  array: ArrayItem[];
}

export interface Response {
  data: Data;
  msg: string;
  result: number;
}
