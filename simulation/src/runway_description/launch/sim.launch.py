import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import ExecuteProcess, DeclareLaunchArgument, AppendEnvironmentVariable
from launch.substitutions import Command, LaunchConfiguration, PathJoinSubstitution, PythonExpression
from launch_ros.actions import Node

def generate_launch_description():
    pkg_dir = get_package_share_directory('runway_description')
    pkg_share_parent = os.path.dirname(pkg_dir)
    models_dir = os.path.join(pkg_dir, 'models')
    xacro_file = os.path.join(pkg_dir, 'urdf', 'ugv.urdf.xacro')
    world_name_arg = DeclareLaunchArgument(
        'world_name',
        default_value='airport_runway',
        description='World name: "airport_runway" or "nus_ea_field"'
    )
    world_arg = DeclareLaunchArgument(
        'world',
        default_value=PythonExpression(["'", pkg_dir, "/worlds/", LaunchConfiguration('world_name'), ".sdf'"]),
        description='Full path to Gazebo world SDF file'
    )
    spawn_x_arg = DeclareLaunchArgument(
        'spawn_x',
        default_value=PythonExpression(["'-25.0' if '", LaunchConfiguration('world_name'), "' == 'nus_ea_field' else '0.0'"]),
        description='Robot spawn X coordinate'
    )
    spawn_y_arg = DeclareLaunchArgument(
        'spawn_y',
        default_value='0.0',
        description='Robot spawn Y coordinate'
    )
    spawn_z_arg = DeclareLaunchArgument(
        'spawn_z',
        default_value='0.2',
        description='Robot spawn Z coordinate'
    )
    spawn_yaw_arg = DeclareLaunchArgument(
        'spawn_yaw',
        default_value=PythonExpression(["'0.0' if '", LaunchConfiguration('world_name'), "' == 'nus_ea_field' else '-0.2274'"]),
        description='Robot spawn Yaw angle'
    )

    world_file = LaunchConfiguration('world')

    # Environment variables so Gazebo Sim can find models, textures, and meshes
    gz_resource_paths = f"{pkg_share_parent}:{models_dir}:{pkg_dir}"

    set_gz_resource_path = AppendEnvironmentVariable(
        name='GZ_SIM_RESOURCE_PATH',
        value=gz_resource_paths
    )
    set_ign_resource_path = AppendEnvironmentVariable(
        name='IGN_GAZEBO_RESOURCE_PATH',
        value=gz_resource_paths
    )
    set_gz_file_path = AppendEnvironmentVariable(
        name='GZ_FILE_PATH',
        value=gz_resource_paths
    )

    # Convert Xacro to Robot State Publisher
    robot_description = Command(['xacro ', xacro_file])

    # 1. Gazebo Sim Process
    gazebo = ExecuteProcess(
        cmd=['gz', 'sim', '-r', world_file],
        output='screen'
    )

    # 2. Robot State Publisher Node
    robot_state_publisher = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        output='screen',
        parameters=[{'robot_description': robot_description, 'use_sim_time': True}]
    )

    # 3. Spawn Robot in Gazebo on the Runway Centerline at (0,0)
    spawn_entity = Node(
        package='ros_gz_sim',
        executable='create',
        arguments=[
            '-name', 'runway_ugv',
            '-topic', 'robot_description',
            '-x', LaunchConfiguration('spawn_x'),
            '-y', LaunchConfiguration('spawn_y'),
            '-z', LaunchConfiguration('spawn_z'),
            '-Y', LaunchConfiguration('spawn_yaw')
        ],
        output='screen'
    )

    # 4. Bridge Gazebo Topics to ROS 2 Topics (Unidirectional to prevent TF loops)
    ros_gz_bridge = Node(
        package='ros_gz_bridge',
        executable='parameter_bridge',
        arguments=[
            '/cmd_vel@geometry_msgs/msg/Twist]gz.msgs.Twist',
            '/odom@nav_msgs/msg/Odometry[gz.msgs.Odometry',
            '/scan@sensor_msgs/msg/LaserScan[gz.msgs.LaserScan',
            '/camera/image_raw@sensor_msgs/msg/Image[gz.msgs.Image',
            '/camera/camera_info@sensor_msgs/msg/CameraInfo[gz.msgs.CameraInfo',
            '/tf@tf2_msgs/msg/TFMessage[gz.msgs.Pose_V',
            '/joint_states@sensor_msgs/msg/JointState[gz.msgs.Model'
        ],
        output='screen'
    )

    return LaunchDescription([
        world_name_arg,
        world_arg,
        spawn_x_arg,
        spawn_y_arg,
        spawn_z_arg,
        spawn_yaw_arg,
        set_gz_resource_path,
        set_ign_resource_path,
        set_gz_file_path,
        gazebo,
        robot_state_publisher,
        spawn_entity,
        ros_gz_bridge
    ])
