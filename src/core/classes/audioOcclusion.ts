import { CMloArchetypeDef } from '../files/codewalker/ytyp';
import { CMapData } from '../files/codewalker/ymap';

import { joaat, convertToInt32 } from '../utils';

export interface PortalEntity {
  LinkType: number;
  MaxOcclusion: number;
  hash_E3674005: number;
  IsDoor: boolean;
  IsGlass: boolean;
}

interface PortalInfo {
  InteriorProxyHash: number;
  PortalIdx: number;
  RoomIdx: number;
  DestInteriorHash: number;
  DestRoomIdx: number;
  PortalEntityList: PortalEntity[];
}

interface PathNodeDirection {
  from: number;
  to: number;
}

interface PathNodeChild {
  PathNodeKey: number;
  PortalInfoIdx: number;
}

interface PathNode {
  Key: number;
  PathNodeChildList: PathNodeChild[];
}

interface IAudioOcclusion {
  CMloArchetypeDef: CMloArchetypeDef;
  CMapData: CMapData;
}

export default class AudioOcclusion {
  private CMloArchetypeDef: CMloArchetypeDef;
  private CMapData: CMapData;

  // Class specific data
  public PortalsEntities: PortalEntity[][];

  // Actual game data
  public occlusionHash: number;
  public PortalInfoList: PortalInfo[];
  public PathNodeList: PathNode[];

  constructor({ CMloArchetypeDef, CMapData }: IAudioOcclusion) {
    this.CMloArchetypeDef = CMloArchetypeDef;
    this.CMapData = CMapData;

    this.PortalsEntities = this.getPortalsEntities();

    this.occlusionHash = this.generateOcclusionHash();
    this.PortalInfoList = this.generatePortalInfoList();
    this.PathNodeList = this.generatePathNodeList();
  }

  private getArchetypeNameHash(): number {
    if (this.CMapData.archetypeName.startsWith('hash_')) {
      const [, hexString] = this.CMapData.archetypeName.split('_');

      return parseInt(hexString, 16);
    }

    return joaat(this.CMapData.archetypeName, true);
  }

  private getPortalsEntities(): PortalEntity[][] {
    return this.CMloArchetypeDef.portals.map(portal =>
      portal.attachedObjects.map(attachedObjectHash => ({
        LinkType: 1,
        MaxOcclusion: 0.7,
        hash_E3674005: attachedObjectHash,
        IsDoor: false,
        IsGlass: false,
      })),
    );
  }

  private generateOcclusionHash(): number {
    const pos = this.CMapData.position;

    return this.getArchetypeNameHash() ^ (pos.x * 100) ^ (pos.y * 100) ^ (pos.z * 100);
  }

  private generatePortalInfoList(): PortalInfo[] {
    let portalInfoList: PortalInfo[] = [];

    this.CMloArchetypeDef.rooms.forEach(room => {
      const roomPortals = this.CMloArchetypeDef.getRoomPortals(room.index);

      roomPortals.sort((a, b) => {
        return a.to - b.to;
      });

      // PortalIdx is relative to RoomIdx
      const roomPortalInfoList = roomPortals.map((portal, index) => {
        const portalEntityList = this.PortalsEntities[index];

        const portalInfo = {
          InteriorProxyHash: this.occlusionHash,
          PortalIdx: index,
          RoomIdx: portal.from,
          DestInteriorHash: this.occlusionHash,
          DestRoomIdx: portal.to,
          PortalEntityList: portalEntityList,
        };

        return portalInfo;
      });

      portalInfoList = [...portalInfoList, ...roomPortalInfoList];
    });

    return portalInfoList;
  }

  private getPathNodeDirections(): PathNodeDirection[] {
    const pathNodeDirections: PathNodeDirection[] = [];

    this.PortalInfoList.forEach(portalInfo => {
      const pathNodeDirection = {
        from: portalInfo.RoomIdx,
        to: portalInfo.DestRoomIdx,
      };

      const directionExists = pathNodeDirections.findIndex(direction => {
        return direction.from === pathNodeDirection.from && direction.to === pathNodeDirection.to;
      });

      if (directionExists !== -1) return;

      pathNodeDirections.push(pathNodeDirection);
    });

    return pathNodeDirections;
  }

  private getRoomOcclusionHash(roomIndex: number): number {
    const room = this.CMloArchetypeDef.rooms[roomIndex];

    if (!room) throw new Error(`Room don't exist`);

    if (room.name === 'limbo') {
      return joaat('outside', true);
    }

    return this.occlusionHash ^ joaat(room.name, true);
  }

  private generatePathNodeList(): PathNode[] {
    const directions = this.getPathNodeDirections();

    const pathNodeList: PathNode[] = [];

    directions.forEach(direction => {
      const startRoomHash = this.getRoomOcclusionHash(direction.from);
      const endRoomHash = this.getRoomOcclusionHash(direction.to);

      const pathNodeChildList: PathNodeChild[] = [];

      this.PortalInfoList.forEach((portalInfo, index) => {
        if (portalInfo.RoomIdx === direction.from && portalInfo.DestRoomIdx === direction.to) {
          pathNodeChildList.push({
            PathNodeKey: 0,
            PortalInfoIdx: index,
          });
        }
      });

      // pathNode for each audio channel
      for (let i = 1; i <= 3; i++) {
        const pathNode = {
          Key: convertToInt32(startRoomHash - endRoomHash) + i,
          PathNodeChildList: pathNodeChildList,
        };

        pathNodeList.push(pathNode);
      }
    });

    return pathNodeList;
  }
}